import { NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket } from 'mysql2/promise';

interface SystemTypeRow extends RowDataPacket {
  system_type: string;
}

export async function GET(): Promise<NextResponse> {
  try {
    const results = await dbUtils.query<SystemTypeRow[]>(
      "SELECT DISTINCT system_type FROM test_benches WHERE system_type IS NOT NULL AND system_type <> '' ORDER BY system_type ASC"
    );
    const system_types = results.map(row => row.system_type);
    return NextResponse.json({ system_types });
  } catch (error: unknown) {
    console.error('Error fetching distinct system types:', error);
    const message = error instanceof Error ? error.message : 'Unknown error fetching system types';
    return NextResponse.json(
      { error: 'Failed to fetch system types', details: message },
      { status: 500 }
    );
  }
} 