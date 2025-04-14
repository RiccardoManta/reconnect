import { NextResponse } from 'next/server';
const Database = require('better-sqlite3');
const path = require('path');

// GET method to fetch all wetbenches
export async function GET() {
  try {
    // Use absolute path for Next.js
    const dbPath = path.resolve(process.cwd(), 'src/db/reconnect.db');
    const db = new Database(dbPath);
    
    // Get all wetbenches
    const wetbenches = db.prepare('SELECT * FROM wetbenches ORDER BY wetbench_id').all();
    
    // Close the database connection
    db.close();
    
    return NextResponse.json({ wetbenches });
  } catch (error) {
    console.error('Error fetching wetbenches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wetbenches' },
      { status: 500 }
    );
  }
} 

// POST method to add a new wetbench
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.wetbench_name) {
      return NextResponse.json(
        { error: 'Wetbench Name is required' },
        { status: 400 }
      );
    }

    // Use absolute path for Next.js
    const dbPath = path.resolve(process.cwd(), 'src/db/reconnect.db');
    const db = new Database(dbPath);

    try {
      // Start a transaction
      db.exec('BEGIN TRANSACTION');
      
      // Insert into wetbenches table
      const result = db.prepare(`
        INSERT INTO wetbenches (
          wetbench_name, 
          pp_number, 
          owner,
          system_type,
          platform,
          system_supplier,
          linked_bench_id,
          actuator_info,
          hardware_components,
          inventory_number
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        body.wetbench_name,
        body.pp_number || null,
        body.owner || null,
        body.system_type || null,
        body.platform || null,
        body.system_supplier || null,
        body.linked_bench_id || null,
        body.actuator_info || null,
        body.hardware_components || null,
        body.inventory_number || null
      );
      
      // Commit the transaction
      db.exec('COMMIT');
      
      // Get the newly added wetbench
      const newWetbench = db.prepare(`
        SELECT * FROM wetbenches WHERE wetbench_id = ?
      `).get(result.lastInsertRowid);
      
      // Close the database connection
      db.close();
      
      return NextResponse.json({ 
        success: true, 
        message: 'Wetbench added successfully',
        wetbench: newWetbench
      });
    } catch (error) {
      // Rollback on error
      db.exec('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error adding wetbench:', error);
    return NextResponse.json(
      { error: 'Failed to add wetbench: ' + error.message },
      { status: 500 }
    );
  }
}

// PUT method to update an existing wetbench
export async function PUT(request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.wetbench_id) {
      return NextResponse.json(
        { error: 'Wetbench ID is required' },
        { status: 400 }
      );
    }

    if (!body.wetbench_name) {
      return NextResponse.json(
        { error: 'Wetbench Name is required' },
        { status: 400 }
      );
    }

    // Use absolute path for Next.js
    const dbPath = path.resolve(process.cwd(), 'src/db/reconnect.db');
    const db = new Database(dbPath);

    try {
      // Start a transaction
      db.exec('BEGIN TRANSACTION');
      
      // Update the wetbench record
      db.prepare(`
        UPDATE wetbenches SET
          wetbench_name = ?, 
          pp_number = ?, 
          owner = ?,
          system_type = ?,
          platform = ?,
          system_supplier = ?,
          linked_bench_id = ?,
          actuator_info = ?,
          hardware_components = ?,
          inventory_number = ?
        WHERE wetbench_id = ?
      `).run(
        body.wetbench_name,
        body.pp_number || null,
        body.owner || null,
        body.system_type || null,
        body.platform || null,
        body.system_supplier || null,
        body.linked_bench_id || null,
        body.actuator_info || null,
        body.hardware_components || null,
        body.inventory_number || null,
        body.wetbench_id
      );
      
      // Commit the transaction
      db.exec('COMMIT');
      
      // Get the updated wetbench
      const updatedWetbench = db.prepare(`
        SELECT * FROM wetbenches WHERE wetbench_id = ?
      `).get(body.wetbench_id);
      
      // Close the database connection
      db.close();
      
      return NextResponse.json({ 
        success: true, 
        message: 'Wetbench updated successfully',
        wetbench: updatedWetbench
      });
    } catch (error) {
      // Rollback on error
      db.exec('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating wetbench:', error);
    return NextResponse.json(
      { error: 'Failed to update wetbench: ' + error.message },
      { status: 500 }
    );
  }
} 