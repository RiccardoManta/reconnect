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

// PUT method to update group details (permissionId)
export async function PUT(
    request: NextRequest, 
    { params }: { params: { groupId: string } }
): Promise<NextResponse> {
    // Check permissions first
    const permissionCheck = await checkAdminPermission(request);
    if (!permissionCheck.isAdmin) {
        return permissionCheck.errorResponse!;
    }

    // Get groupId directly from destructured params
    const groupId = parseInt(params.groupId, 10);
    if (isNaN(groupId)) {
        return NextResponse.json({ error: 'Invalid Group ID in URL.' }, { status: 400 });
    }

    try {
        // Extract only the permissionId from the body
        const body = await request.json();
        const permissionId = body.permissionId;

        if (typeof permissionId !== 'number') {
            return NextResponse.json({ error: 'Valid permissionId is required.' }, { status: 400 });
        }

        // Perform the update
        const affectedRows = await update(
            'UPDATE user_groups SET permission_id = ? WHERE user_group_id = ?',
            [permissionId, groupId]
        );

        if (affectedRows === 0) {
            return NextResponse.json({ error: 'Group not found or no update needed.' }, { status: 404 });
        }

        // Fetch the updated group data, including joins for names
        const updatedGroupQuery = `
            SELECT 
                ug.user_group_id, 
                ug.user_group_name, 
                ug.permission_id, 
                p.permission_name, 
                GROUP_CONCAT(gpa.platform_id ORDER BY gpa.platform_id ASC) AS accessible_platform_ids,
                GROUP_CONCAT(pt.platform_name ORDER BY pt.platform_name ASC) AS accessible_platform_names
            FROM user_groups ug
            LEFT JOIN permissions p ON ug.permission_id = p.permission_id
            LEFT JOIN group_platform_access gpa ON ug.user_group_id = gpa.user_group_id
            LEFT JOIN platforms pt ON gpa.platform_id = pt.platform_id
            WHERE ug.user_group_id = ?
            GROUP BY ug.user_group_id, ug.user_group_name, ug.permission_id, p.permission_name
        `;
        const updatedGroup = await queryOne<RowDataPacket>(
           updatedGroupQuery,
            [groupId]
        );

        // Return the comprehensive updated group data
        return NextResponse.json({ success: true, message: 'Group updated successfully.', group: updatedGroup });

    } catch (error: unknown) {
        console.error(`Error updating group ${groupId}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: 'Failed to update group', details: message }, { status: 500 });
    }
} 