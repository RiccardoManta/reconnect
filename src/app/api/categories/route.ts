import { NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket } from 'mysql2/promise';

// Interface for the expected result from the distinct platform query
interface CategoryResult extends RowDataPacket {
    platform_id: number;
}

// GET method to fetch all unique platforms as categories
export async function GET(): Promise<NextResponse> {
  try {
    // Get unique platforms using dbUtils
    const categoriesResult = await dbUtils.query<CategoryResult[]>(`
      SELECT DISTINCT platform_id
      FROM test_bench_project_overview
      WHERE platform_id IS NOT NULL
      ORDER BY platform_id
    `);
    
    // Extract just the platform ID values
    const categoryList = categoriesResult.map(cat => cat.platform_id);
    
    return NextResponse.json({ categories: categoryList });

  } catch (error: unknown) {
    console.error('Error fetching categories:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch categories', details: message },
      { status: 500 }
    );
  }
} 