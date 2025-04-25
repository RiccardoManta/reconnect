import { NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket } from 'mysql2/promise';

// Interface for the result of the distinct query
interface DistinctType extends RowDataPacket {
    bench_type: string;
}

// GET method to fetch distinct bench types
export async function GET(): Promise<NextResponse> {
  try {
    // Query for distinct, non-null bench_type values
    const query = 'SELECT DISTINCT bench_type FROM test_benches WHERE bench_type IS NOT NULL ORDER BY bench_type ASC';
    
    // Use the generic query function which returns rows directly
    const results = await dbUtils.query<DistinctType[]>(query);
    
    // Extract the string values from the result objects
    const benchTypes = results.map(row => row.bench_type);

    return NextResponse.json({ benchTypes });

  } catch (error: unknown) {
    console.error('Error fetching distinct bench types:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch bench types', details: message },
      { status: 500 }
    );
  }
} 