import { NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket } from 'mysql2/promise';

// Interface for the result of the distinct query
interface BenchTypeRow extends RowDataPacket {
    bench_type: string;
}

// GET method to fetch distinct bench types
export async function GET(): Promise<NextResponse> {
  try {
    // Query for distinct, non-null bench_type values
    const query = "SELECT DISTINCT bench_type FROM test_benches WHERE bench_type IS NOT NULL AND bench_type <> '' ORDER BY bench_type ASC";
    
    // Use the generic query function which returns rows directly
    const results = await dbUtils.query<BenchTypeRow[]>(query);
    
    // Extract the string values from the result objects
    const bench_types = results.map(row => row.bench_type);

    return NextResponse.json({ bench_types });

  } catch (error: unknown) {
    console.error('Error fetching distinct bench types:', error);
    const message = error instanceof Error ? error.message : 'Unknown error fetching bench types';
    return NextResponse.json(
      { error: 'Failed to fetch bench types', details: message },
      { status: 500 }
    );
  }
} 