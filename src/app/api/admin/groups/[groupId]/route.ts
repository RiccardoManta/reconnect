import { NextRequest, NextResponse } from 'next/server';
import { queryOne, update } from '@/db/dbUtils';
import { RowDataPacket } from 'mysql2/promise';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/authOptions';
import { getUserPermissions } from '@/utils/server/permissionUtils';

// Interface for request body
interface UpdateGroupRequest {
    permissionId?: number;
    groupName?: string; // Allow updating name too, if needed later
}

// Interface for checking if permission exists
interface PermissionCheck extends RowDataPacket {
    count: number;
}

// Helper function for admin check (copied)
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

// PUT method to update group details (permissionId, potentially name)
export async function PUT(request: NextRequest, context: any): Promise<NextResponse> {
    // Check permissions first
    const permissionCheck = await checkAdminPermission(request);
    if (!permissionCheck.isAdmin) {
        return permissionCheck.errorResponse!;
    }

    // Get groupId from route parameters using optional chaining and casting
    const groupIdString = (context?.params?.groupId as string) || '';
    const groupId = parseInt(groupIdString, 10);
    if (isNaN(groupId)) {
        return NextResponse.json({ error: 'Invalid Group ID in URL.' }, { status: 400 });
    }

    try {
        const body: UpdateGroupRequest = await request.json();
        const { permissionId, groupName } = body;

        // Validate input: At least one field must be provided for update
        if (permissionId === undefined && groupName === undefined) {
            return NextResponse.json({ error: 'No update data provided (permissionId or groupName required).' }, { status: 400 });
        }

        let sql = 'UPDATE user_groups SET';
        const params: (string | number)[] = [];
        const setClauses: string[] = [];

        // Update permission ID if provided
        if (permissionId !== undefined) {
             if (typeof permissionId !== 'number') {
                return NextResponse.json({ error: 'Invalid permissionId format (must be a number).' }, { status: 400 });
            }
            // Check if the provided permissionId actually exists
            const permExists = await queryOne<PermissionCheck>('SELECT COUNT(*) as count FROM permissions WHERE permission_id = ?', [permissionId]);
            if (!permExists || permExists.count === 0) {
                 return NextResponse.json({ error: `Permission ID ${permissionId} does not exist.` }, { status: 400 });
            }
            setClauses.push('permission_id = ?');
            params.push(permissionId);
        }

        // Update group name if provided
        if (groupName !== undefined) {
            const trimmedGroupName = groupName.trim();
            if (trimmedGroupName.length === 0) {
                 return NextResponse.json({ error: 'Group Name cannot be empty.' }, { status: 400 });
            }
             // Optional: Check for duplicate name if renaming
            // const existingGroup = await queryOne<RowDataPacket>('SELECT user_group_id FROM user_groups WHERE LOWER(user_group_name) = LOWER(?) AND user_group_id != ?', [trimmedGroupName, groupId]);
            // if (existingGroup) {
            //     return NextResponse.json({ error: `Group name '${trimmedGroupName}' already exists.` }, { status: 409 });
            // }
            setClauses.push('user_group_name = ?');
            params.push(trimmedGroupName);
        }

        sql += ' ' + setClauses.join(', ') + ' WHERE user_group_id = ?';
        params.push(groupId);

        // Execute update
        const affectedRows = await update(sql, params);

        if (affectedRows > 0) {
            return NextResponse.json({ success: true, message: `Group ${groupId} updated successfully.` });
        } else {
            // Check if group exists before declaring not found
            const groupExists = await queryOne<RowDataPacket>('SELECT user_group_id FROM user_groups WHERE user_group_id = ?', [groupId]);
            if (!groupExists) {
                 return NextResponse.json({ error: `Group ${groupId} not found.` }, { status: 404 });
            } else {
                // Group exists, but nothing changed (e.g., same data sent)
                 return NextResponse.json({ success: true, message: `Group ${groupId} data unchanged.` }); // Or return 304? 200 is often fine.
            }
        }

    } catch (error: unknown) {
        console.error(`API Error updating group ${groupId}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        // Handle potential duplicate name errors during update (race condition)
        if (message.includes('Duplicate entry') && message.includes('user_group_name')) {
             return NextResponse.json({ error: 'Group name already exists.', details: message }, { status: 409 });
        }
        return NextResponse.json(
            { error: 'Failed to update group.', details: message },
            { status: 500 }
        );
    }
} 