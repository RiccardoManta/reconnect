import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/db/dbUtils';
import { RowDataPacket } from 'mysql2/promise';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/authOptions';
import { getUserPermissions } from '@/utils/server/permissionUtils';

// Interface for Permission data
interface Permission extends RowDataPacket {
  permission_id: number;
  permission_name: string;
}

// Helper function for admin check (copied from groups route)
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


// GET method to fetch all permissions
export async function GET(request: NextRequest): Promise<NextResponse> {
    // Check permissions first
    const permissionCheck = await checkAdminPermission(request);
    if (!permissionCheck.isAdmin) {
        return permissionCheck.errorResponse!;
    }

    try {
        const permissions = await query<Permission[]>(`
            SELECT permission_id, permission_name 
            FROM permissions 
            ORDER BY permission_id ASC 
        `);
        
        return NextResponse.json({ permissions });

    } catch (error: unknown) {
        console.error('API Error fetching permissions:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
          { error: 'Failed to fetch permissions', details: message },
          { status: 500 }
        );
    }
} 