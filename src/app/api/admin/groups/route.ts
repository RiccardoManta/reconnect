import { NextResponse } from 'next/server';
import { query } from '@/db/dbUtils';
import { RowDataPacket } from 'mysql2/promise';

// Interface for Group data
interface Group extends RowDataPacket {
  user_group_id: number;
  user_group_name: string;
}

// GET method to fetch all groups
export async function GET(): Promise<NextResponse> {
  try {
    const groups = await query<Group[]>(`
      SELECT user_group_id, user_group_name
      FROM user_groups
      ORDER BY user_group_name ASC
    `);

    const groupsArray = Array.isArray(groups) ? groups : [];
    
    return NextResponse.json({ groups: groupsArray });

  } catch (error: unknown) {
    console.error('API Error fetching groups:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch groups', details: message },
      { status: 500 }
    );
  }
} 