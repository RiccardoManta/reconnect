import { NextRequest, NextResponse } from 'next/server';
// import type { NextApiRequest } from 'next'; // No longer needed
import { transaction } from '@/db/dbUtils';
import { PoolConnection } from 'mysql2/promise';
import { getServerSession } from "next-auth/next"; // Import
import { authOptions } from '@/lib/authOptions'; // Import
import { getUserPermissions } from '@/utils/server/permissionUtils'; // Import

// Interface for expected request body
interface UpdatePlatformsRequest {
    platformIds: number[];
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

// Update function signature to use context: any and access params via context
export async function PUT(
    request: NextRequest, 
    context: any // Apply workaround: Use context: any
): Promise<NextResponse> {
    // Check permissions first
    const permissionCheck = await checkAdminPermission(request);
    if (!permissionCheck.isAdmin) {
        return permissionCheck.errorResponse!;
    }

    // Access groupId via context using optional chaining and casting
    const groupIdStr = (context?.params?.groupId as string) || ''; 
    const groupId = parseInt(groupIdStr, 10); 

    if (isNaN(groupId)) {
        return NextResponse.json({ error: 'Invalid Group ID in URL.' }, { status: 400 });
    }

    try {
        const body: UpdatePlatformsRequest = await request.json();
        // Validate platformIds
        if (!Array.isArray(body.platformIds) || body.platformIds.some(id => typeof id !== 'number')) {
             return NextResponse.json({ error: 'platformIds must be an array of numbers.' }, { status: 400 });
        }
        
        const platformIds = body.platformIds;

        // Use transaction for reliability
        await transaction(async (connection) => {
            // Delete existing entries for the group
            await connection.query('DELETE FROM group_platform_access WHERE user_group_id = ?', [groupId]);

            // Insert new entries if any platforms were provided
            if (platformIds.length > 0) {
                const insertValues = platformIds.map(platformId => [groupId, platformId]);
                await connection.query('INSERT INTO group_platform_access (user_group_id, platform_id) VALUES ?', [insertValues]);
            }
        });
        
        return NextResponse.json({ success: true, message: 'Group platform access updated successfully.' });

    } catch (error: unknown) {
        console.error(`Error updating platform access for group ${groupId}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: 'Failed to update group platform access', details: message }, { status: 500 });
    }
} 