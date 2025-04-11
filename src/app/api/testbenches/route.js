import { NextResponse } from 'next/server';
import testBenches from '../../../db/testBenches';

// GET method to fetch all test benches
export async function GET() {
  try {
    const data = testBenches.getAllTestBenches();
    return NextResponse.json({ testBenches: data });
  } catch (error) {
    console.error('Error fetching test benches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test benches' },
      { status: 500 }
    );
  }
} 