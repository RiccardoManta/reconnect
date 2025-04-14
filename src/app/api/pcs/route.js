import { NextResponse } from 'next/server';
const Database = require('better-sqlite3');
const path = require('path');

// GET method to fetch all PC overviews
export async function GET() {
  try {
    // Use absolute path for Next.js
    const dbPath = path.resolve(process.cwd(), 'src/db/reconnect.db');
    const db = new Database(dbPath);
    
    // Get all PCs
    const pcs = db.prepare('SELECT * FROM pc_overview ORDER BY pc_id').all();
    
    // Close the database connection
    db.close();
    
    return NextResponse.json({ pcs });
  } catch (error) {
    console.error('Error fetching PC overviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PC overviews' },
      { status: 500 }
    );
  }
} 

// POST method to add a new PC overview
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
    
    if (!data.pc_name) {
      return NextResponse.json(
        { error: 'PC name is required' },
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
    
    // Insert the new PC overview record
    const result = db.prepare(`
      INSERT INTO pc_overview (
        bench_id, 
        pc_name, 
        purchase_year, 
        inventory_number, 
        pc_role, 
        pc_model, 
        special_equipment, 
        mac_address, 
        ip_address, 
        active_licenses, 
        installed_tools, 
        pc_info_text, 
        status, 
        active_user
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.bench_id,
      data.pc_name,
      data.purchase_year || null,
      data.inventory_number || '',
      data.pc_role || '',
      data.pc_model || '',
      data.special_equipment || '',
      data.mac_address || '',
      data.ip_address || '',
      data.active_licenses || '',
      data.installed_tools || '',
      data.pc_info_text || '',
      data.status || 'offline',
      data.active_user || ''
    );
    
    // Get the newly inserted record
    const newPc = db.prepare(`
      SELECT pc.*
      FROM pc_overview pc
      WHERE pc.pc_id = ?
    `).get(result.lastInsertRowid);
    
    // Close the database connection
    db.close();
    
    return NextResponse.json({ 
      message: 'PC overview added successfully',
      pc: newPc
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error adding PC overview:', error);
    return NextResponse.json(
      { error: 'Failed to add PC overview' },
      { status: 500 }
    );
  }
}

// PUT method to update an existing PC overview
export async function PUT(request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.pc_id) {
      return NextResponse.json(
        { error: 'PC ID is required' },
        { status: 400 }
      );
    }
    
    if (!data.bench_id) {
      return NextResponse.json(
        { error: 'Test bench ID is required' },
        { status: 400 }
      );
    }
    
    if (!data.pc_name) {
      return NextResponse.json(
        { error: 'PC name is required' },
        { status: 400 }
      );
    }
    
    // Use absolute path for Next.js
    const dbPath = path.resolve(process.cwd(), 'src/db/reconnect.db');
    const db = new Database(dbPath);
    
    // Check if the PC overview exists
    const existingPc = db.prepare(`
      SELECT * FROM pc_overview WHERE pc_id = ?
    `).get(data.pc_id);
    
    if (!existingPc) {
      db.close();
      return NextResponse.json(
        { error: 'PC overview record not found' },
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
    
    // Update the PC overview record
    db.prepare(`
      UPDATE pc_overview
      SET bench_id = ?,
          pc_name = ?,
          purchase_year = ?,
          inventory_number = ?,
          pc_role = ?,
          pc_model = ?,
          special_equipment = ?,
          mac_address = ?,
          ip_address = ?,
          active_licenses = ?,
          installed_tools = ?,
          pc_info_text = ?,
          status = ?,
          active_user = ?
      WHERE pc_id = ?
    `).run(
      data.bench_id,
      data.pc_name,
      data.purchase_year || null,
      data.inventory_number || '',
      data.pc_role || '',
      data.pc_model || '',
      data.special_equipment || '',
      data.mac_address || '',
      data.ip_address || '',
      data.active_licenses || '',
      data.installed_tools || '',
      data.pc_info_text || '',
      data.status || 'offline',
      data.active_user || '',
      data.pc_id
    );
    
    // Get the updated record
    const updatedPc = db.prepare(`
      SELECT pc.*
      FROM pc_overview pc
      WHERE pc.pc_id = ?
    `).get(data.pc_id);
    
    // Close the database connection
    db.close();
    
    return NextResponse.json({ 
      message: 'PC overview updated successfully',
      pc: updatedPc
    });
    
  } catch (error) {
    console.error('Error updating PC overview:', error);
    return NextResponse.json(
      { error: 'Failed to update PC overview' },
      { status: 500 }
    );
  }
} 