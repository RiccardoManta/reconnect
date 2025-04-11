import { NextResponse } from 'next/server';
import testBenches from '../../../../db/testBenches';

// GET method to fetch a test bench by ID
export async function GET(request, { params }) {
  try {
    const id = params.id;
    const data = testBenches.getTestBenchById(parseInt(id));
    
    if (!data) {
      return NextResponse.json(
        { error: 'Test bench not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ testBench: data });
  } catch (error) {
    console.error(`Error fetching test bench ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch test bench' },
      { status: 500 }
    );
  }
} 