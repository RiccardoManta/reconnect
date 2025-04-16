import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// Interface for HIL Operation data returned by API
interface HilOperation extends RowDataPacket {
    operation_id: number;
    bench_id: number;
    hil_name: string; // Joined from test_benches
    possible_tests: string | null;
    vehicle_datasets: string | null;
    scenarios: string | null;
    controldesk_projects: string | null;
}

// Interface for POST/PUT request body
interface HilOperationRequestBody {
    operation_id?: number; // Only for PUT
    bench_id: number;
    possible_tests?: string;
    vehicle_datasets?: string;
    scenarios?: string;
    controldesk_projects?: string;
}

// GET method to fetch all HIL operation data
export async function GET(): Promise<NextResponse> {
  try {
    const operations = await dbUtils.query<HilOperation[]>(`
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
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: HilOperationRequestBody = await request.json();
    
    // Validate required fields
    if (!body.bench_id) {
      return NextResponse.json(
        { error: 'Test Bench ID (bench_id) is required' },
        { status: 400 }
      );
    }

    // Check if the referenced test bench exists
    const testBench = await dbUtils.queryOne(
        `SELECT bench_id FROM test_benches WHERE bench_id = ?`, 
        [body.bench_id]
    );
    if (!testBench) {
      return NextResponse.json(
        { error: 'Test Bench with the specified bench_id not found' },
        { status: 404 }
      );
    }

    // Insert the new HIL operation record using dbUtils.insert
    const operationId = await dbUtils.insert(
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

    if (!operationId) {
        throw new Error("Failed to get operation_id after insert.");
    }

    // Get the newly inserted record
    const newOperation = await dbUtils.queryOne<HilOperation>(
      `SELECT o.*, t.hil_name
       FROM hil_operation o
       LEFT JOIN test_benches t ON o.bench_id = t.bench_id
       WHERE o.operation_id = ?`,
      [operationId]
    );
        
    return NextResponse.json({ 
      success: true, 
      message: 'HIL operation added successfully',
      operation: newOperation
    }, { status: 201 }); // 201 Created status
    
  } catch (error: unknown) {
    console.error('Error adding HIL operation:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to add HIL operation', details: message },
      { status: 500 }
    );
  }
}

// PUT method to update an existing HIL operation entry
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
        `SELECT bench_id FROM test_benches WHERE bench_id = ?`, 
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
      `UPDATE hil_operation SET
         bench_id = ?, 
         possible_tests = ?, 
         vehicle_datasets = ?,
         scenarios = ?,
         controldesk_projects = ?
       WHERE operation_id = ?`, 
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
    const updatedOperation = await dbUtils.queryOne<HilOperation>(
        `SELECT o.*, t.hil_name
         FROM hil_operation o
         LEFT JOIN test_benches t ON o.bench_id = t.bench_id
         WHERE o.operation_id = ?`,
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