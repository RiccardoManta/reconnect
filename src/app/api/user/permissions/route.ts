import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/authOptions';
import { getUserPermissions } from '@/utils/server/permissionUtils'; // Ensure this path is correct

export async function GET(request: NextRequest): Promise<NextResponse> {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        // Return 'read' or a default permission if no user is logged in, 
        // or handle as unauthorized depending on desired behavior for non-logged-in users.
        // Returning a default 'read' might be safer for client-side checks.
        return NextResponse.json({ permissionName: 'Read' }); 
        // Alternatively: return NextResponse.json({ error: 'Unauthorized: Not logged in' }, { status: 401 });
    }

    try {
        const userId = parseInt(session.user.id, 10);
        if (isNaN(userId)) {
             console.error("Invalid user ID in session:", session.user.id);
             // Return default or error
             return NextResponse.json({ permissionName: 'Read' }); 
             // Alternatively: return NextResponse.json({ error: 'Unauthorized: Invalid user ID' }, { status: 401 });
        }
        
        // Get permissions using the utility function
        const { permissionName } = await getUserPermissions(userId);

        return NextResponse.json({ permissionName: permissionName || 'Read' }); // Default to 'Read' if null/undefined

    } catch (error: unknown) {
        console.error("API Error fetching user permissions:", error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        // Return a default permission on error to prevent breaking the UI
        return NextResponse.json({ permissionName: 'Read' }); 
        // Alternatively: return NextResponse.json({ error: 'Failed to get user permissions', details: message }, { status: 500 });
    }
} 