import { NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket } from 'mysql2/promise';

// Interface for the result of the distinct query
interface DistinctType extends RowDataPacket {
    system_type: string;
}

export async function GET(): Promise<NextResponse> {
  try {
    // Query for distinct, non-null system_type values
    const query = 'SELECT DISTINCT system_type FROM test_benches WHERE system_type IS NOT NULL ORDER BY system_type ASC';
    
    // Use the generic query function which returns rows directly
    const results = await dbUtils.query<DistinctType[]>(query);
    
    // Extract the string values from the result objects
    const systemTypes = results.map(row => row.system_type);

    return NextResponse.json({ systemTypes });

  } catch (error: unknown) {
    console.error('Error fetching distinct system types:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch system types', details: message },
      { status: 500 }
    );
  }
} 