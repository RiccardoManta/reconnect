import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { User } from '@/types/database'; // For return type

interface UserGroupUpdateRequestBody {
  user_group_id: number | null;
}

export async function PUT(
    request: NextRequest,
    context: any // Apply workaround: Use context: any
): Promise<NextResponse> {
    try {
        // Access userId via context using optional chaining and casting
        const userIdStr = (context?.params?.id as string) || '';
        const userId = parseInt(userIdStr, 10);

        if (isNaN(userId)) {
            return NextResponse.json({ error: 'Invalid User ID in URL path' }, { status: 400 });
        }

        const body: UserGroupUpdateRequestBody = await request.json();
        const { user_group_id } = body;

        // Validate user_group_id (it can be null to unassign, or a valid number)
        if (user_group_id !== null && (typeof user_group_id !== 'number' || isNaN(user_group_id))) {
            return NextResponse.json({ error: 'Invalid user_group_id. Must be a number or null.' }, { status: 400 });
        }

        // Check if the user exists
        const existingUser = await dbUtils.queryOne<User>(
            `SELECT user_id FROM users WHERE user_id = ?`,
            [userId]
        );
        if (!existingUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // If user_group_id is provided, check if the group exists
        if (user_group_id !== null) {
            const groupExists = await dbUtils.queryOne(
                `SELECT user_group_id FROM user_groups WHERE user_group_id = ?`,
                [user_group_id]
            );
            if (!groupExists) {
                return NextResponse.json({ error: `User group with ID ${user_group_id} not found.` }, { status: 404 });
            }
        }

        const affectedRows = await dbUtils.update(
            `UPDATE users SET user_group_id = ? WHERE user_id = ?`,
            [user_group_id, userId]
        );

        if (affectedRows === 0 && user_group_id !== existingUser.user_group_id) {
            // This might happen if the user_id was valid but somehow update failed, 
            // or if the group_id was the same as current (though frontend should prevent that call)
            console.warn(`User group update for user ${userId} to group ${user_group_id} affected 0 rows.`);
            // Potentially return an error or just proceed to fetch current state.
        }

        // Fetch the updated user details to return
        const updatedUser = await dbUtils.queryOne<User>(
            `SELECT 
                u.user_id,
                u.user_name,
                u.company_username,
                u.email,
                u.user_group_id, 
                ug.user_group_name,
                p.permission_name
             FROM users u
             LEFT JOIN user_groups ug ON u.user_group_id = ug.user_group_id
             LEFT JOIN permissions p ON ug.permission_id = p.permission_id
             WHERE u.user_id = ?`,
            [userId]
        );

        return NextResponse.json({
            success: true,
            message: 'User group updated successfully',
            user: updatedUser,
        });

    } catch (error: unknown) {
        console.error('Error updating user group:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to update user group', details: message },
            { status: 500 }
        );
    }
} 