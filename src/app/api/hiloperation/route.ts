import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
// Use aliased types from database.ts and remove local definitions if they exist
import { HilOperation as HilOperationType, HilOperationRequestBody, TestBench } from '@/types/database'; 
import { checkApiPermission } from '@/utils/server/permissionUtils';

// GET method to fetch all HIL operation data
export async function GET(): Promise<NextResponse> {
  try {
    const operations = await dbUtils.query<HilOperationType[]>(`
      SELECT o.*, t.hil_name
      FROM hil_operation o
      LEFT JOIN test_benches t ON o.bench_id = t.bench_id
      ORDER BY o.operation_id
    `);
    
    return NextResponse.json({ operations });

  } catch (error: unknown) {
    console.error('Error fetching HIL operation data:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch HIL operation data', details: message },
      { status: 500 }
    );
  }
}

// POST method to add a new HIL operation entry
export async function POST(request: NextRequest, context: any): Promise<NextResponse> {
    // API Protection
    const permissionCheck = await checkApiPermission(request, ['Edit', 'Admin']);
    if (!permissionCheck.isAuthorized) {
        return permissionCheck.errorResponse!;
    }
    try {
        const body: HilOperationRequestBody = await request.json();

        if (!body.bench_id) {
            return NextResponse.json({ error: 'Test Bench ID (bench_id) is required.' }, { status: 400 });
        }

        const result = await dbUtils.insert(
            `INSERT INTO hil_operation (bench_id, possible_tests, vehicle_datasets, scenarios, controldesk_projects) 
             VALUES (?, ?, ?, ?, ?)`, 
            [
                body.bench_id, 
                body.possible_tests || null, 
                body.vehicle_datasets || null, 
                body.scenarios || null,
                body.controldesk_projects || null
            ]
        );
        const newHilOpId = result;

        const newHilOperation = await dbUtils.queryOne<HilOperationType>(
            `SELECT ho.*, tb.hil_name 
             FROM hil_operation ho
             JOIN test_benches tb ON ho.bench_id = tb.bench_id
             WHERE ho.operation_id = ?`,
            [newHilOpId]
        );

        return NextResponse.json({ success: true, hil_operation: newHilOperation }, { status: 201 });

    } catch (error: unknown) {
        console.error('[API POST /api/hiloperation] Error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        if (message.includes('foreign key constraint fails')) {
            return NextResponse.json(
                { error: `Failed to add HIL operation: Invalid bench_id.`, details: message },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: 'Failed to add HIL operation entry', details: message },
            { status: 500 }
        );
    }
}

// PUT method to update an existing HIL operation entry
/*
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body: HilOperationRequestBody = await request.json();
    
    // Validate required fields for PUT
    if (!body.operation_id) {
      return NextResponse.json(
        { error: 'Operation ID (operation_id) is required for update' },
        { status: 400 }
      );
    }
    if (!body.bench_id) {
      return NextResponse.json(
        { error: 'Test Bench ID (bench_id) is required' },
        { status: 400 }
      );
    }

    // Check if the referenced test bench exists
    const testBench = await dbUtils.queryOne(
        \`SELECT bench_id FROM test_benches WHERE bench_id = ?\`, 
        [body.bench_id]
    );
    if (!testBench) {
      return NextResponse.json(
        { error: 'Referenced Test Bench with the specified bench_id not found' },
        { status: 404 }
      );
    }

    // Update the HIL operation record using dbUtils.update
    const affectedRows = await dbUtils.update(
      \`UPDATE hil_operation SET
         bench_id = ?, 
         possible_tests = ?, 
         vehicle_datasets = ?,
         scenarios = ?,
         controldesk_projects = ?
       WHERE operation_id = ?\`, 
      [
        body.bench_id,
        body.possible_tests || null,
        body.vehicle_datasets || null,
        body.scenarios || null,
        body.controldesk_projects || null,
        body.operation_id
      ]
    );
    
    // Check if any row was actually updated
    if (affectedRows === 0) {
      return NextResponse.json(
        { error: 'HIL operation record not found or no changes made' },
        { status: 404 }
      );
    }

    // Get the updated record
    const updatedOperation = await dbUtils.queryOne<HilOperationType>(
        \`SELECT o.*, t.hil_name
         FROM hil_operation o
         LEFT JOIN test_benches t ON o.bench_id = t.bench_id
         WHERE o.operation_id = ?\`,
        [body.operation_id]
    );
        
    return NextResponse.json({ 
      success: true, 
      message: 'HIL operation updated successfully',
      operation: updatedOperation
    });
    
  } catch (error: unknown) {
    console.error('Error updating HIL operation:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update HIL operation', details: message },
      { status: 500 }
    );
  }
} 
*/ 