import { NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket } from 'mysql2/promise';

export interface UserGroup extends RowDataPacket {
  user_group_id: number;
  user_group_name: string;
  permission_id?: number; // Optional, if you also want to send permission_id
  permission_name?: string; // Optional, if you want to send permission_name
}

export async function GET(): Promise<NextResponse> {
  try {
    // Fetches user groups and optionally their associated permission name
    const query = `
      SELECT 
        ug.user_group_id,
        ug.user_group_name,
        ug.permission_id,
        p.permission_name
      FROM user_groups ug
      LEFT JOIN permissions p ON ug.permission_id = p.permission_id
      ORDER BY ug.user_group_name;
    `;
    const userGroups = await dbUtils.query<UserGroup[]>(query);

    return NextResponse.json({ user_groups: userGroups });
  } catch (error: unknown) {
    console.error('Error fetching user groups:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch user groups', details: message },
      { status: 500 }
    );
  }
} 