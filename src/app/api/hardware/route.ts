import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// Interface for hardware data returned by API
interface HardwareInstallation extends RowDataPacket {
    install_id: number;
    bench_id: number;
    hil_name: string; // Joined from test_benches
    ecu_info: string | null;
    sensors: string | null;
    additional_periphery: string | null;
}

// Interface for POST/PUT request body
interface HardwareRequestBody {
    install_id?: number; // Only for PUT
    bench_id: number;
    ecu_info?: string;
    sensors?: string;
    additional_periphery?: string;
}

// GET method to fetch all hardware installation data
export async function GET(): Promise<NextResponse> {
  try {
    const hardware = await dbUtils.query<HardwareInstallation[]>(`
      SELECT h.*, t.hil_name
      FROM hardware_installation h
      LEFT JOIN test_benches t ON h.bench_id = t.bench_id
      ORDER BY h.install_id
    `);
    
    return NextResponse.json({ hardware });

  } catch (error: unknown) {
    console.error('Error fetching hardware installation data:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch hardware installation data', details: message },
      { status: 500 }
    );
  }
}

// POST method to add a new hardware installation record
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: HardwareRequestBody = await request.json();
    
    // Validate required fields
    if (!body.bench_id) {
      return NextResponse.json(
        { error: 'Test bench ID (bench_id) is required' },
        { status: 400 }
      );
    }
    
    // Check if the referenced test bench exists
    const testBench = await dbUtils.queryOne(
        `SELECT bench_id, hil_name FROM test_benches WHERE bench_id = ?`, 
        [body.bench_id]
    );
    
    if (!testBench) {
      return NextResponse.json(
        { error: 'Test bench with the specified bench_id not found' },
        { status: 404 }
      );
    }
    
    // Insert the new hardware installation record using dbUtils.insert
    const installId = await dbUtils.insert(
      `INSERT INTO hardware_installation (bench_id, ecu_info, sensors, additional_periphery) VALUES (?, ?, ?, ?)`, 
      [
        body.bench_id,
        body.ecu_info || null, // Use null for empty strings if desired
        body.sensors || null,
        body.additional_periphery || null
      ]
    );
    
    if (!installId) {
        throw new Error("Failed to get install_id after insert.")
    }

    // Get the newly inserted record
    const newHardware = await dbUtils.queryOne<HardwareInstallation>(
      `SELECT h.*, t.hil_name
       FROM hardware_installation h
       LEFT JOIN test_benches t ON h.bench_id = t.bench_id
       WHERE h.install_id = ?`,
      [installId]
    );
        
    return NextResponse.json({ 
      message: 'Hardware installation added successfully',
      hardware: newHardware
    }, { status: 201 }); // 201 Created status
    
  } catch (error: unknown) {
    console.error('Error adding hardware installation:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to add hardware installation', details: message },
      { status: 500 }
    );
  }
}

// PUT method to update an existing hardware installation record
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body: HardwareRequestBody = await request.json();
    
    // Validate required fields for PUT
    if (!body.install_id) {
      return NextResponse.json(
        { error: 'Installation ID (install_id) is required for update' },
        { status: 400 }
      );
    }
    // Bench ID is also required if we allow changing it, or just for validation
    if (!body.bench_id) {
      return NextResponse.json(
        { error: 'Test bench ID (bench_id) is required' },
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
        { error: 'Referenced Test bench with the specified bench_id not found' },
        { status: 404 }
      );
    }

    // Update the hardware installation record using dbUtils.update
    const affectedRows = await dbUtils.update(
      `UPDATE hardware_installation
       SET bench_id = ?, ecu_info = ?, sensors = ?, additional_periphery = ?
       WHERE install_id = ?`, 
      [
        body.bench_id,
        body.ecu_info || null,
        body.sensors || null,
        body.additional_periphery || null,
        body.install_id
      ]
    );
    
    // Check if any row was actually updated
    if (affectedRows === 0) {
      return NextResponse.json(
        { error: 'Hardware installation record not found or no changes made' },
        { status: 404 } // Or 304 Not Modified if no data changed but record exists
      );
    }

    // Get the updated record
    const updatedHardware = await dbUtils.queryOne<HardwareInstallation>(
        `SELECT h.*, t.hil_name
         FROM hardware_installation h
         LEFT JOIN test_benches t ON h.bench_id = t.bench_id
         WHERE h.install_id = ?`,
        [body.install_id]
    );
        
    return NextResponse.json({ 
      message: 'Hardware installation updated successfully',
      hardware: updatedHardware
    });
    
  } catch (error: unknown) {
    console.error('Error updating hardware installation:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update hardware installation', details: message },
      { status: 500 }
    );
  }
} 