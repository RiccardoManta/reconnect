import { NextResponse } from 'next/server';
import { query } from '@/db/dbUtils';
import { RowDataPacket } from 'mysql2/promise';

// Interface for Platform data
interface Platform extends RowDataPacket {
  platform_id: number;
  platform_name: string;
}

// GET method to fetch all platforms
export async function GET(): Promise<NextResponse> {
  try {
    const platforms = await query<Platform[]>(`
      SELECT platform_id, platform_name 
      FROM platforms 
      ORDER BY platform_name ASC
    `);

    const platformsArray = Array.isArray(platforms) ? platforms : [];
    
    return NextResponse.json({ platforms: platformsArray });

  } catch (error: unknown) {
    console.error('API Error fetching platforms:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch platforms', details: message },
      { status: 500 }
    );
  }
} 