import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/authOptions";
import { getUserPermissions } from '../../../../utils/server/permissionUtils';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);
    if (isNaN(userId)) {
      console.error('[API][GET][/api/auth/permission] Invalid userId format:', session.user.id);
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    const permissions = await getUserPermissions(userId);

    // Return only the permission name
    return NextResponse.json({ permissionName: permissions.permissionName });

  } catch (error) {
    console.error('[API][GET][/api/auth/permission] Error fetching permission:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch user permission', details: message },
      { status: 500 }
    );
  }
} 