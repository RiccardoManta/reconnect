import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { Wetbench } from '@/types/database'; // Use the main Wetbench type

// Interface for POST/PUT request body
interface WetbenchRequestBody {
    wetbench_id?: number;
    wetbench_name: string;
    pp_number?: string;
    owner?: string;
    system_type?: string;
    system_supplier?: string;
    linked_bench_id?: number | null;
    actuator_info?: string;
    hardware_components?: string;
    inventory_number?: string;
}

// GET method to fetch all wetbenches
export async function GET(): Promise<NextResponse> {
  try {
    const query = `
      SELECT 
         w.*, 
         tb.hil_name
       FROM wetbenches w
       LEFT JOIN test_benches tb ON w.linked_bench_id = tb.bench_id
       ORDER BY w.wetbench_id;
    `;
    const wetbenches = await dbUtils.query<Wetbench[]>(query);
    
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
    
    if (!body.wetbench_name) {
      return NextResponse.json(
        { error: 'Wetbench Name (wetbench_name) is required' },
        { status: 400 }
      );
    }

    if (body.linked_bench_id !== undefined && body.linked_bench_id !== null) {
        const testBench = await dbUtils.queryOne(
            `SELECT bench_id FROM test_benches WHERE bench_id = ?`, 
            [body.linked_bench_id]
        );
        if (!testBench) {
          return NextResponse.json(
            { error: 'Invalid linked_bench_id: The referenced Test Bench does not exist.' },
            { status: 400 }
          );
        }
    }

    const wetbench_id = await dbUtils.insert(
      `INSERT INTO wetbenches (wetbench_name, pp_number, owner, system_type, system_supplier, linked_bench_id, actuator_info, hardware_components, inventory_number) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.wetbench_name,
        body.pp_number || null,
        body.owner || null,
        body.system_type || null,
        body.system_supplier || null,
        body.linked_bench_id === undefined ? null : body.linked_bench_id,
        body.actuator_info || null,
        body.hardware_components || null,
        body.inventory_number || null
      ]
    );

    if (!wetbench_id) {
        throw new Error("Failed to get wetbench_id after insert.");
    }

    const newWetbench = await dbUtils.queryOne<Wetbench>(
      `SELECT 
         w.*, 
         tb.hil_name
       FROM wetbenches w
       LEFT JOIN test_benches tb ON w.linked_bench_id = tb.bench_id
       WHERE w.wetbench_id = ?`,
      [wetbench_id]
    );
        
    return NextResponse.json({ 
      success: true, 
      message: 'Wetbench added successfully',
      wetbench: newWetbench
    }, { status: 201 });
    
  } catch (error: unknown) {
    console.error('Error adding wetbench:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('foreign key constraint fails') && message.includes('`linked_bench_id`')) {
      return NextResponse.json(
        { error: 'Failed to add wetbench: Invalid linked_bench_id. The referenced Test Bench does not exist.', details: message },
        { status: 400 }
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

    if (body.linked_bench_id !== undefined && body.linked_bench_id !== null) {
        const testBench = await dbUtils.queryOne(
            `SELECT bench_id FROM test_benches WHERE bench_id = ?`, 
            [body.linked_bench_id]
        );
        if (!testBench) {
          return NextResponse.json(
            { error: 'Invalid linked_bench_id: The referenced Test Bench does not exist.' },
            { status: 400 }
          );
        }
    }

    const affectedRows = await dbUtils.update(
      `UPDATE wetbenches SET
         wetbench_name = ?, pp_number = ?, owner = ?, system_type = ?, 
         system_supplier = ?, linked_bench_id = ?, actuator_info = ?, hardware_components = ?, 
         inventory_number = ?
       WHERE wetbench_id = ?`,
      [
        body.wetbench_name,
        body.pp_number || null,
        body.owner || null,
        body.system_type || null,
        body.system_supplier || null,
        body.linked_bench_id === undefined ? null : body.linked_bench_id,
        body.actuator_info || null,
        body.hardware_components || null,
        body.inventory_number || null,
        body.wetbench_id
      ]
    );
    
    if (affectedRows === 0) {
        const existingWetbench = await dbUtils.queryOne<Wetbench>(
            `SELECT wetbench_id FROM wetbenches WHERE wetbench_id = ?`, 
            [body.wetbench_id]
        );
        if (!existingWetbench) {
            return NextResponse.json({ error: 'Wetbench record not found' }, { status: 404 });
        } 
    }

    const updatedWetbench = await dbUtils.queryOne<Wetbench>(
        `SELECT 
           w.*, 
           tb.hil_name
         FROM wetbenches w
         LEFT JOIN test_benches tb ON w.linked_bench_id = tb.bench_id
         WHERE w.wetbench_id = ?`,
        [body.wetbench_id]
    );

    if (!updatedWetbench && affectedRows > 0) {
        return NextResponse.json({ error: 'Failed to retrieve wetbench after update.', details: "Record updated but could not be fetched." }, { status: 500 });
    }
    if (!updatedWetbench && affectedRows === 0) {
        return NextResponse.json({ error: 'Wetbench record not found' }, { status: 404 });
    }
        
    return NextResponse.json({ 
      success: true, 
      message: affectedRows > 0 ? 'Wetbench updated successfully' : 'Wetbench update successful (no changes detected)',
      wetbench: updatedWetbench
    });
    
  } catch (error: unknown) {
    console.error('Error updating wetbench:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('foreign key constraint fails') && message.includes('`linked_bench_id`')) {
      return NextResponse.json(
        { error: 'Failed to update wetbench: Invalid linked_bench_id. The referenced Test Bench does not exist.', details: message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update wetbench', details: message },
      { status: 500 }
    );
  }
} 