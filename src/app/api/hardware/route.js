import { NextResponse } from 'next/server';
const Database = require('better-sqlite3');
const path = require('path');

// GET method to fetch all hardware installation data
export async function GET() {
  try {
    // Use absolute path for Next.js
    const dbPath = path.resolve(process.cwd(), 'src/db/reconnect.db');
    const db = new Database(dbPath);
    
    // Get all hardware installation data with test bench info
    const hardware = db.prepare(`
      SELECT h.*, t.hil_name
      FROM hardware_installation h
      LEFT JOIN test_benches t ON h.bench_id = t.bench_id
      ORDER BY h.install_id
    `).all();
    
    // Close the database connection
    db.close();
    
    return NextResponse.json({ hardware });
  } catch (error) {
    console.error('Error fetching hardware installation data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hardware installation data' },
      { status: 500 }
    );
  }
}

// POST method to add a new hardware installation record
export async function POST(request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.bench_id) {
      return NextResponse.json(
        { error: 'Test bench ID is required' },
        { status: 400 }
      );
    }
    
    // Use absolute path for Next.js
    const dbPath = path.resolve(process.cwd(), 'src/db/reconnect.db');
    const db = new Database(dbPath);
    
    // Get the test bench info to include the name in the response
    const testBench = db.prepare(`
      SELECT hil_name FROM test_benches WHERE bench_id = ?
    `).get(data.bench_id);
    
    if (!testBench) {
      db.close();
      return NextResponse.json(
        { error: 'Test bench not found' },
        { status: 404 }
      );
    }
    
    // Insert the new hardware installation record
    const result = db.prepare(`
      INSERT INTO hardware_installation (bench_id, ecu_info, sensors, additional_periphery)
      VALUES (?, ?, ?, ?)
    `).run(
      data.bench_id,
      data.ecu_info || '',
      data.sensors || '',
      data.additional_periphery || ''
    );
    
    // Get the newly inserted record
    const newHardware = db.prepare(`
      SELECT h.*, t.hil_name
      FROM hardware_installation h
      LEFT JOIN test_benches t ON h.bench_id = t.bench_id
      WHERE h.install_id = ?
    `).get(result.lastInsertRowid);
    
    // Close the database connection
    db.close();
    
    return NextResponse.json({ 
      message: 'Hardware installation added successfully',
      hardware: newHardware
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error adding hardware installation:', error);
    return NextResponse.json(
      { error: 'Failed to add hardware installation' },
      { status: 500 }
    );
  }
}

// PUT method to update an existing hardware installation record
export async function PUT(request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.install_id) {
      return NextResponse.json(
        { error: 'Installation ID is required' },
        { status: 400 }
      );
    }
    
    if (!data.bench_id) {
      return NextResponse.json(
        { error: 'Test bench ID is required' },
        { status: 400 }
      );
    }
    
    // Use absolute path for Next.js
    const dbPath = path.resolve(process.cwd(), 'src/db/reconnect.db');
    const db = new Database(dbPath);
    
    // Check if the hardware installation exists
    const existingHardware = db.prepare(`
      SELECT * FROM hardware_installation WHERE install_id = ?
    `).get(data.install_id);
    
    if (!existingHardware) {
      db.close();
      return NextResponse.json(
        { error: 'Hardware installation record not found' },
        { status: 404 }
      );
    }
    
    // Check if the test bench exists
    const testBench = db.prepare(`
      SELECT hil_name FROM test_benches WHERE bench_id = ?
    `).get(data.bench_id);
    
    if (!testBench) {
      db.close();
      return NextResponse.json(
        { error: 'Test bench not found' },
        { status: 404 }
      );
    }
    
    // Update the hardware installation record
    db.prepare(`
      UPDATE hardware_installation
      SET bench_id = ?,
          ecu_info = ?,
          sensors = ?,
          additional_periphery = ?
      WHERE install_id = ?
    `).run(
      data.bench_id,
      data.ecu_info || '',
      data.sensors || '',
      data.additional_periphery || '',
      data.install_id
    );
    
    // Get the updated record
    const updatedHardware = db.prepare(`
      SELECT h.*, t.hil_name
      FROM hardware_installation h
      LEFT JOIN test_benches t ON h.bench_id = t.bench_id
      WHERE h.install_id = ?
    `).get(data.install_id);
    
    // Close the database connection
    db.close();
    
    return NextResponse.json({ 
      message: 'Hardware installation updated successfully',
      hardware: updatedHardware
    });
    
  } catch (error) {
    console.error('Error updating hardware installation:', error);
    return NextResponse.json(
      { error: 'Failed to update hardware installation' },
      { status: 500 }
    );
  }
} 