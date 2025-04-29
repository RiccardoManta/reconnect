import { query, queryOne } from '@/db/dbUtils';
import { RowDataPacket } from 'mysql2/promise';

// Define expected return structure
export interface UserPermissionContext {
    permissionName: string; // e.g., 'Default', 'Read', 'Edit', 'Admin'
    accessiblePlatformIds: number[]; // Array of platform IDs the user's group can access
}

// Interfaces for DB query results
interface UserGroupInfo extends RowDataPacket {
    user_group_id: number | null;
}

interface GroupPermissionInfo extends RowDataPacket {
    permission_id: number;
    permission_name: string;
}

interface PlatformAccessInfo extends RowDataPacket {
    platform_id: number;
}

/**
 * Fetches the permission name and accessible platform IDs for a given user.
 * Handles users not assigned to a group (defaults to 'Default' permission and no platforms).
 * @param userId The numeric ID of the user.
 * @returns Promise resolving to UserPermissionContext object.
 */
export async function getUserPermissions(userId: number): Promise<UserPermissionContext> {
    try {
        // 1. Get the user's group ID
        const userGroup = await queryOne<UserGroupInfo>(
            'SELECT user_group_id FROM users WHERE user_id = ?',
            [userId]
        );

        // Handle case where user doesn't exist or has no group
        if (!userGroup || userGroup.user_group_id === null) {
            console.warn(`User ${userId} not found or not assigned to a group. Applying Default permissions.`);
            return { permissionName: 'Default', accessiblePlatformIds: [] };
        }

        const groupId = userGroup.user_group_id;

        // 2. Get the group's permission name
        const groupPermission = await queryOne<GroupPermissionInfo>(
            `SELECT ug.permission_id, p.permission_name 
             FROM user_groups ug
             JOIN permissions p ON ug.permission_id = p.permission_id
             WHERE ug.user_group_id = ?`,
            [groupId]
        );

        // Handle case where group or permission might be missing (data integrity issue)
        if (!groupPermission) {
            console.error(`Could not find permission details for group ${groupId}. Applying Default permissions.`);
            return { permissionName: 'Default', accessiblePlatformIds: [] };
        }

        const permissionName = groupPermission.permission_name;

        // 3. Get the platforms accessible by this group
        const platformAccess = await query<PlatformAccessInfo[]>(
            'SELECT platform_id FROM group_platform_access WHERE user_group_id = ?',
            [groupId]
        );

        const accessiblePlatformIds = platformAccess.map(row => row.platform_id);

        // Special case: Admins get access to everything (represented by all platform IDs for now)
        // Consider a more robust way later if needed (e.g., a specific flag)
        if (permissionName === 'Admin') {
             // Optional: Fetch all platform IDs if needed, or just use the name 'Admin' as the indicator
             // For now, returning the explicitly assigned ones might be fine, relying on API checks for 'Admin' status
             // console.log(`User ${userId} is Admin, returning all accessible platforms defined for group.`);
        }

        return {
            permissionName,
            accessiblePlatformIds,
        };

    } catch (error) {
        console.error(`Error fetching permissions for user ${userId}:`, error);
        // Fallback to default permissions on any error during fetch
        return { permissionName: 'Default', accessiblePlatformIds: [] };
    }
} 