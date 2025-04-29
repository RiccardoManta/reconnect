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

// Workaround: Use context: any as per important_Information.md
export async function PUT(request: NextRequest, context: any): Promise<NextResponse> {
    // Check permissions first
    const permissionCheck = await checkAdminPermission(request);
    if (!permissionCheck.isAdmin) {
        return permissionCheck.errorResponse!;
    }

    // Access params using optional chaining and type casting
    const groupIdString = (context?.params?.groupId as string) || '';
    const groupId = parseInt(groupIdString, 10); 

    if (isNaN(groupId)) {
        return NextResponse.json({ error: 'Invalid Group ID in URL.' }, { status: 400 });
    }

    try {
        const body: UpdatePlatformsRequest = await request.json();
        const { platformIds } = body;

        if (!Array.isArray(platformIds) || !platformIds.every(id => typeof id === 'number')) {
            return NextResponse.json({ error: 'Invalid format: platformIds must be an array of numbers.' }, { status: 400 });
        }

        await transaction(async (connection: PoolConnection) => {
            await connection.query(
                'DELETE FROM group_platform_access WHERE user_group_id = ?',
                [groupId]
            );

            if (platformIds.length > 0) {
                const values = platformIds.map(platformId => [groupId, platformId]);
                await connection.query(
                    'INSERT INTO group_platform_access (user_group_id, platform_id) VALUES ?',
                    [values] 
                );
            }
        });

        return NextResponse.json({
            success: true,
            message: `Platform access for group ${groupId} updated successfully.`
        });

    } catch (error: unknown) {
        console.error(`API Error updating platform access for group ${groupId}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        
        if (message.includes('foreign key constraint fails')) {
             return NextResponse.json({ error: 'Invalid Platform ID provided.', details: message }, { status: 400 });
        }
        if (message.includes('group not found')) { 
             return NextResponse.json({ error: 'Group not found.', details: message }, { status: 404 });
        }

        return NextResponse.json(
            { error: 'Failed to update platform access.', details: message },
            { status: 500 }
        );
    }
} 