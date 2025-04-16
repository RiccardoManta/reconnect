import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// Interface for HIL Technology data returned by API
interface HilTechnology extends RowDataPacket {
    tech_id: number;
    bench_id: number;
    hil_name: string; // Joined from test_benches
    fiu_info: string | null;
    io_info: string | null;
    can_interface: string | null;
    power_interface: string | null;
    possible_tests: string | null;
    leakage_module: string | null;
}

// Interface for POST/PUT request body
interface HilTechnologyRequestBody {
    tech_id?: number; // Only for PUT
    bench_id: number;
    fiu_info?: string;
    io_info?: string;
    can_interface?: string;
    power_interface?: string;
    possible_tests?: string;
    leakage_module?: string;
}

// GET method to fetch all HIL technology data
export async function GET(): Promise<NextResponse> {
  try {
    const technology = await dbUtils.query<HilTechnology[]>(`
      SELECT h.*, t.hil_name 
      FROM hil_technology h
      LEFT JOIN test_benches t ON h.bench_id = t.bench_id
      ORDER BY h.tech_id
    `);
    
    return NextResponse.json({ technology });

  } catch (error: unknown) {
    console.error('Error fetching HIL technology data:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch HIL technology data', details: message },
      { status: 500 }
    );
  }
}

// POST method to add a new HIL technology entry
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: HilTechnologyRequestBody = await request.json();
    
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

    // Insert the new HIL technology record using dbUtils.insert
    const techId = await dbUtils.insert(
      `INSERT INTO hil_technology (bench_id, fiu_info, io_info, can_interface, power_interface, possible_tests, leakage_module) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`, 
      [
        body.bench_id,
        body.fiu_info || null,
        body.io_info || null,
        body.can_interface || null,
        body.power_interface || null,
        body.possible_tests || null,
        body.leakage_module || null
      ]
    );

    if (!techId) {
        throw new Error("Failed to get tech_id after insert.");
    }

    // Get the newly inserted record
    const newTechnology = await dbUtils.queryOne<HilTechnology>(
      `SELECT h.*, t.hil_name 
       FROM hil_technology h
       LEFT JOIN test_benches t ON h.bench_id = t.bench_id
       WHERE h.tech_id = ?`,
      [techId]
    );
        
    return NextResponse.json({ 
      success: true, 
      message: 'HIL technology added successfully',
      technology: newTechnology
    }, { status: 201 });
    
  } catch (error: unknown) {
    console.error('Error adding HIL technology:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to add HIL technology', details: message },
      { status: 500 }
    );
  }
}

// PUT method to update an existing HIL technology entry
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body: HilTechnologyRequestBody = await request.json();
    
    // Validate required fields for PUT
    if (!body.tech_id) {
      return NextResponse.json(
        { error: 'Technology ID (tech_id) is required for update' },
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

    // Update the HIL technology record using dbUtils.update
    const affectedRows = await dbUtils.update(
      `UPDATE hil_technology SET
         bench_id = ?, 
         fiu_info = ?, 
         io_info = ?,
         can_interface = ?,
         power_interface = ?,
         possible_tests = ?,
         leakage_module = ?
       WHERE tech_id = ?`, 
      [
        body.bench_id,
        body.fiu_info || null,
        body.io_info || null,
        body.can_interface || null,
        body.power_interface || null,
        body.possible_tests || null,
        body.leakage_module || null,
        body.tech_id
      ]
    );
    
    if (affectedRows === 0) {
      return NextResponse.json(
        { error: 'HIL technology record not found or no changes made' },
        { status: 404 }
      );
    }

    // Get the updated record
    const updatedTechnology = await dbUtils.queryOne<HilTechnology>(
        `SELECT h.*, t.hil_name 
         FROM hil_technology h
         LEFT JOIN test_benches t ON h.bench_id = t.bench_id
         WHERE h.tech_id = ?`,
        [body.tech_id]
    );
        
    return NextResponse.json({ 
      success: true, 
      message: 'HIL technology updated successfully',
      technology: updatedTechnology
    });
    
  } catch (error: unknown) {
    console.error('Error updating HIL technology:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update HIL technology', details: message },
      { status: 500 }
    );
  }
} 