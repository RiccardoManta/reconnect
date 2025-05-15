import { NextResponse } from 'next/server';
import { query } from '@/db/dbUtils';
import { DutDiagnostic } from '@/types/database';

export async function GET() {
  try {
    const dutDiagnostics = await query<DutDiagnostic[]>(
      `SELECT 
         diagnostic_id AS diagnosticId,
         odis,
         internal_dut_values AS internalDutValues
       FROM dut_diagnostics
       ORDER BY diagnostic_id`
    );
    
    return NextResponse.json({ dutDiagnostics: dutDiagnostics || [] });
  } catch (error) {
    console.error('Failed to fetch DUT diagnostics:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: 'Failed to fetch DUT diagnostics', details: errorMessage }, { status: 500 });
  }
} 