import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// Interface for Wetbench data returned by API
interface Wetbench extends RowDataPacket {
    wetbench_id: number;
    wetbench_name: string;
    pp_number: string | null;
    owner: string | null;
    system_type: string | null;
    platform: string | null;
    system_supplier: string | null;
    linked_bench_id: number | null;
    actuator_info: string | null;
    hardware_components: string | null;
    inventory_number: string | null;
}

// Interface for POST/PUT request body
interface WetbenchRequestBody {
    wetbench_id?: number; // Only for PUT
    wetbench_name: string;
    pp_number?: string;
    owner?: string;
    system_type?: string;
    platform?: string;
    system_supplier?: string;
    linked_bench_id?: number;
    actuator_info?: string;
    hardware_components?: string;
    inventory_number?: string;
}

// GET method to fetch all wetbenches
export async function GET(): Promise<NextResponse> {
  try {
    const wetbenches = await dbUtils.query<Wetbench[]>(
      `SELECT * FROM wetbenches ORDER BY wetbench_id`
    );
    
    return NextResponse.json({ wetbenches });

  } catch (error: unknown) {
    console.error('Error fetching wetbenches:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch wetbenches', details: message },
      { status: 500 }
    );
  }
}

// POST method to add a new wetbench
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: WetbenchRequestBody = await request.json();
    
    // Validate required fields
    if (!body.wetbench_name) {
      return NextResponse.json(
        { error: 'Wetbench Name (wetbench_name) is required' },
        { status: 400 }
      );
    }

    // Optional: Check if linked_bench_id exists if provided
    if (body.linked_bench_id !== undefined && body.linked_bench_id !== null) {
        const testBench = await dbUtils.queryOne(
            `SELECT bench_id FROM test_benches WHERE bench_id = ?`, 
            [body.linked_bench_id]
        );
        if (!testBench) {
          return NextResponse.json(
            { error: 'Invalid linked_bench_id: The referenced Test Bench does not exist.' },
            { status: 400 } // Bad request due to invalid foreign key
          );
        }
    }

    // Insert the new wetbench record using dbUtils.insert
    const wetbenchId = await dbUtils.insert(
      `INSERT INTO wetbenches (wetbench_name, pp_number, owner, system_type, platform, system_supplier, linked_bench_id, actuator_info, hardware_components, inventory_number) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
      [
        body.wetbench_name,
        body.pp_number || null,
        body.owner || null,
        body.system_type || null,
        body.platform || null,
        body.system_supplier || null,
        body.linked_bench_id === undefined ? null : body.linked_bench_id, // Handle undefined for optional field
        body.actuator_info || null,
        body.hardware_components || null,
        body.inventory_number || null
      ]
    );

    if (!wetbenchId) {
        throw new Error("Failed to get wetbench_id after insert.");
    }

    // Get the newly inserted record
    const newWetbench = await dbUtils.queryOne<Wetbench>(
      `SELECT * FROM wetbenches WHERE wetbench_id = ?`,
      [wetbenchId]
    );
        
    return NextResponse.json({ 
      success: true, 
      message: 'Wetbench added successfully',
      wetbench: newWetbench
    }, { status: 201 });
    
  } catch (error: unknown) {
    console.error('Error adding wetbench:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    // Specific check for foreign key constraints on linked_bench_id
    if (message.includes('foreign key constraint fails') && message.includes('`linked_bench_id`')) {
      return NextResponse.json(
        { error: 'Failed to add wetbench: Invalid linked_bench_id. The referenced Test Bench does not exist.', details: message },
        { status: 400 } // Bad request due to invalid foreign key
      );
    }
    return NextResponse.json(
      { error: 'Failed to add wetbench', details: message },
      { status: 500 }
    );
  }
}

// PUT method to update an existing wetbench
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body: WetbenchRequestBody = await request.json();
    
    // Validate required fields for PUT
    if (body.wetbench_id === undefined || body.wetbench_id === null) {
      return NextResponse.json(
        { error: 'Wetbench ID (wetbench_id) is required for update' },
        { status: 400 }
      );
    }
    if (!body.wetbench_name) {
      return NextResponse.json(
        { error: 'Wetbench Name (wetbench_name) is required' },
        { status: 400 }
      );
    }

     // Optional: Check if linked_bench_id exists if provided
    if (body.linked_bench_id !== undefined && body.linked_bench_id !== null) {
        const testBench = await dbUtils.queryOne(
            `SELECT bench_id FROM test_benches WHERE bench_id = ?`, 
            [body.linked_bench_id]
        );
        if (!testBench) {
          return NextResponse.json(
            { error: 'Invalid linked_bench_id: The referenced Test Bench does not exist.' },
            { status: 400 } // Bad request due to invalid foreign key
          );
        }
    }

    // Update the wetbench record using dbUtils.update
    const affectedRows = await dbUtils.update(
      `UPDATE wetbenches SET
         wetbench_name = ?, pp_number = ?, owner = ?, system_type = ?, platform = ?, 
         system_supplier = ?, linked_bench_id = ?, actuator_info = ?, hardware_components = ?, 
         inventory_number = ?
       WHERE wetbench_id = ?`, 
      [
        body.wetbench_name,
        body.pp_number || null,
        body.owner || null,
        body.system_type || null,
        body.platform || null,
        body.system_supplier || null,
        body.linked_bench_id === undefined ? null : body.linked_bench_id, // Handle undefined for optional field
        body.actuator_info || null,
        body.hardware_components || null,
        body.inventory_number || null,
        body.wetbench_id
      ]
    );
    
    if (affectedRows === 0) {
      const existingWetbench = await dbUtils.queryOne(
          `SELECT wetbench_id FROM wetbenches WHERE wetbench_id = ?`, 
          [body.wetbench_id]
      );
       if (!existingWetbench) {
           return NextResponse.json({ error: 'Wetbench record not found' }, { status: 404 });
        } else {
           const updatedWetbench = await dbUtils.queryOne<Wetbench>(
            `SELECT * FROM wetbenches WHERE wetbench_id = ?`,
            [body.wetbench_id]
           );
           return NextResponse.json({ 
             success: true, 
             message: 'Wetbench update successful (no changes detected)',
             wetbench: updatedWetbench
           });
        }
    }

    // Get the updated record
    const updatedWetbench = await dbUtils.queryOne<Wetbench>(
        `SELECT * FROM wetbenches WHERE wetbench_id = ?`,
        [body.wetbench_id]
    );
        
    return NextResponse.json({ 
      success: true, 
      message: 'Wetbench updated successfully',
      wetbench: updatedWetbench
    });
    
  } catch (error: unknown) {
    console.error('Error updating wetbench:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    // Specific check for foreign key constraints on linked_bench_id
    if (message.includes('foreign key constraint fails') && message.includes('`linked_bench_id`')) {
      return NextResponse.json(
        { error: 'Failed to update wetbench: Invalid linked_bench_id. The referenced Test Bench does not exist.', details: message },
        { status: 400 } // Bad request due to invalid foreign key
      );
    }
    return NextResponse.json(
      { error: 'Failed to update wetbench', details: message },
      { status: 500 }
    );
  }
} 