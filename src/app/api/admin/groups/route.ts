import { NextResponse, NextRequest } from 'next/server';
import { query, insert } from '@/db/dbUtils';
import { RowDataPacket } from 'mysql2/promise';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/authOptions';
import { getUserPermissions } from '@/utils/server/permissionUtils';

// Interface for Group data (used by GET and returned by POST)
interface Group extends RowDataPacket {
  user_group_id: number;
  user_group_name: string;
  accessible_platform_ids?: string | null; // Comma-separated IDs from GROUP_CONCAT
  accessible_platform_names?: string | null; // Comma-separated names from GROUP_CONCAT
}

// Interface for POST request body
interface CreateGroupRequest {
    groupName: string;
}

// Helper function for admin check (copied from users route)
async function checkAdminPermission(request: NextRequest): Promise<{ isAdmin: boolean; errorResponse?: NextResponse }> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return { isAdmin: false, errorResponse: NextResponse.json({ error: 'Unauthorized: Not logged in' }, { status: 401 }) };
    }
    const userId = parseInt(session.user.id, 10);
    if (isNaN(userId)) {
         return { isAdmin: false, errorResponse: NextResponse.json({ error: 'Unauthorized: Invalid user ID in session' }, { status: 401 }) };
    }
    const { permissionName } = await getUserPermissions(userId);
    if (permissionName !== 'Admin') {
        return { isAdmin: false, errorResponse: NextResponse.json({ error: 'Forbidden: Requires Admin privileges' }, { status: 403 }) };
    }
    return { isAdmin: true };
}

// GET method to fetch all groups with their accessible platforms AND permission names
export async function GET(request: NextRequest): Promise<NextResponse> {
    // Check permissions first
    const permissionCheck = await checkAdminPermission(request);
    if (!permissionCheck.isAdmin) {
        return permissionCheck.errorResponse!;
    }

    try {
        // Join groups with permissions, access table and platforms
        const groups = await query<Group[]>(`
          SELECT 
            ug.user_group_id, 
            ug.user_group_name,
            ug.permission_id,      -- Include permission_id
            p_main.permission_name,-- Include permission_name
            GROUP_CONCAT(DISTINCT plat.platform_id ORDER BY plat.platform_name ASC) AS accessible_platform_ids,
            GROUP_CONCAT(DISTINCT plat.platform_name ORDER BY plat.platform_name ASC SEPARATOR ', ') AS accessible_platform_names
          FROM user_groups ug
          JOIN permissions p_main ON ug.permission_id = p_main.permission_id -- Join for permission name
          LEFT JOIN group_platform_access gpa ON ug.user_group_id = gpa.user_group_id
          LEFT JOIN platforms plat ON gpa.platform_id = plat.platform_id
          GROUP BY ug.user_group_id, ug.user_group_name, ug.permission_id, p_main.permission_name
          ORDER BY ug.user_group_name ASC
        `);
        
        // Map results (keysToCamel will handle snake_case to camelCase)
        const groupsArray = Array.isArray(groups) ? groups.map(g => ({...g})) : []; 

        return NextResponse.json({ groups: groupsArray });

    } catch (error: unknown) {
        console.error('API Error fetching groups with platforms and permissions:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
          { error: 'Failed to fetch groups', details: message },
          { status: 500 }
        );
    }
}

// POST method to create a new group
export async function POST(request: NextRequest): Promise<NextResponse> {
    // Check permissions first
    const permissionCheck = await checkAdminPermission(request);
    if (!permissionCheck.isAdmin) {
        return permissionCheck.errorResponse!;
    }

    try {
        const body: CreateGroupRequest = await request.json();
        const { groupName } = body;

        // Validate input
        if (!groupName || groupName.trim().length === 0) {
            return NextResponse.json({ error: 'Group Name is required.' }, { status: 400 });
        }
        const trimmedGroupName = groupName.trim();

        // Optional: Check if group name already exists (case-insensitive check example)
        const existingGroup = await query<Group[]>(
            'SELECT user_group_id FROM user_groups WHERE LOWER(user_group_name) = LOWER(?)',
            [trimmedGroupName]
        );
        if (existingGroup.length > 0) {
            return NextResponse.json({ error: `Group name '${trimmedGroupName}' already exists.` }, { status: 409 }); // 409 Conflict
        }

        // Insert new group
        const newGroupId = await insert(
            'INSERT INTO user_groups (user_group_name, permission_id) VALUES (?, ?)',
            [trimmedGroupName, 1]
        );

        if (newGroupId) {
             // Fetch the newly created group data to return
             const newGroup = await query<Group[]>(`
                SELECT user_group_id, user_group_name 
                FROM user_groups 
                WHERE user_group_id = ?
            `, [newGroupId]);
            
            return NextResponse.json({
                success: true,
                message: 'Group created successfully',
                group: { ...newGroup[0], accessible_platform_ids: null, accessible_platform_names: null, permission_id: 1 } 
            }, { status: 201 });
        } else {
            throw new Error('Group creation succeeded but insertId was not returned or was zero.');
        }

    } catch (error: unknown) {
        console.error('API Error creating group:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
         // Handle potential duplicate name errors during insert (race condition)
        if (message.includes('Duplicate entry') && message.includes('user_group_name')) {
             return NextResponse.json({ error: 'Group name already exists.', details: message }, { status: 409 });
        }
        return NextResponse.json(
            { error: 'Failed to create group.', details: message },
            { status: 500 }
        );
    }
} 