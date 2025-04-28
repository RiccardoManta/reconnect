import { NextResponse, NextRequest } from 'next/server';
import { query, insert } from '@/db/dbUtils';
import { RowDataPacket } from 'mysql2/promise';

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

// GET method to fetch all groups with their accessible platforms
export async function GET(): Promise<NextResponse> {
  try {
    // Join groups with access table and platforms, group by group, and concat platform info
    const groups = await query<Group[]>(`
      SELECT 
        ug.user_group_id, 
        ug.user_group_name,
        GROUP_CONCAT(p.platform_id ORDER BY p.platform_name ASC) AS accessible_platform_ids,
        GROUP_CONCAT(p.platform_name ORDER BY p.platform_name ASC SEPARATOR ', ') AS accessible_platform_names
      FROM user_groups ug
      LEFT JOIN group_platform_access gpa ON ug.user_group_id = gpa.user_group_id
      LEFT JOIN platforms p ON gpa.platform_id = p.platform_id
      GROUP BY ug.user_group_id, ug.user_group_name
      ORDER BY ug.user_group_name ASC
    `);
    
    // GROUP_CONCAT returns null if no platforms are linked, handle this case
    const groupsArray = Array.isArray(groups) ? groups.map(g => ({...g})) : []; // Create shallow copies if needed

    return NextResponse.json({ groups: groupsArray });

  } catch (error: unknown) {
    console.error('API Error fetching groups with platforms:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch groups', details: message },
      { status: 500 }
    );
  }
}

// POST method to create a new group
export async function POST(request: NextRequest): Promise<NextResponse> {
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
            'INSERT INTO user_groups (user_group_name) VALUES (?)',
            [trimmedGroupName]
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
                // Newly created group won't have platforms yet, so no need to query them here
                group: { ...newGroup[0], accessible_platform_ids: null, accessible_platform_names: null } 
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