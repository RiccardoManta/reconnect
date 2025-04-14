import { NextResponse } from 'next/server';
const Database = require('better-sqlite3');
const path = require('path');

// GET method to fetch all HIL technology data
export async function GET() {
  try {
    // Use absolute path for Next.js
    const dbPath = path.resolve(process.cwd(), 'src/db/reconnect.db');
    const db = new Database(dbPath);
    
    // Get all HIL technology data with test bench info
    const technology = db.prepare(`
      SELECT h.*, t.hil_name 
      FROM hil_technology h
      LEFT JOIN test_benches t ON h.bench_id = t.bench_id
      ORDER BY h.tech_id
    `).all();
    
    // Close the database connection
    db.close();
    
    return NextResponse.json({ technology });
  } catch (error) {
    console.error('Error fetching HIL technology data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch HIL technology data' },
      { status: 500 }
    );
  }
}

// POST method to add a new HIL technology entry
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.bench_id) {
      return NextResponse.json(
        { error: 'Test Bench ID is required' },
        { status: 400 }
      );
    }

    // Use absolute path for Next.js
    const dbPath = path.resolve(process.cwd(), 'src/db/reconnect.db');
    const db = new Database(dbPath);

    try {
      // First check if the bench_id exists
      const benchExists = db.prepare('SELECT bench_id FROM test_benches WHERE bench_id = ?').get(body.bench_id);
      if (!benchExists) {
        return NextResponse.json(
          { error: 'Test Bench not found' },
          { status: 400 }
        );
      }

      // Start a transaction
      db.exec('BEGIN TRANSACTION');
      
      // Insert into hil_technology table
      const result = db.prepare(`
        INSERT INTO hil_technology (
          bench_id, 
          fiu_info, 
          io_info,
          can_interface,
          power_interface,
          possible_tests,
          leakage_module
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        body.bench_id,
        body.fiu_info || null,
        body.io_info || null,
        body.can_interface || null,
        body.power_interface || null,
        body.possible_tests || null,
        body.leakage_module || null
      );
      
      // Commit the transaction
      db.exec('COMMIT');
      
      // Get the newly added technology entry with test bench info
      const newTechnology = db.prepare(`
        SELECT h.*, t.hil_name 
        FROM hil_technology h
        LEFT JOIN test_benches t ON h.bench_id = t.bench_id
        WHERE h.tech_id = ?
      `).get(result.lastInsertRowid);
      
      // Close the database connection
      db.close();
      
      return NextResponse.json({ 
        success: true, 
        message: 'HIL technology added successfully',
        technology: newTechnology
      });
    } catch (error) {
      // Rollback on error
      db.exec('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error adding HIL technology:', error);
    return NextResponse.json(
      { error: 'Failed to add HIL technology: ' + error.message },
      { status: 500 }
    );
  }
}

// PUT method to update an existing HIL technology entry
export async function PUT(request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.tech_id) {
      return NextResponse.json(
        { error: 'Technology ID is required' },
        { status: 400 }
      );
    }

    if (!body.bench_id) {
      return NextResponse.json(
        { error: 'Test Bench ID is required' },
        { status: 400 }
      );
    }

    // Use absolute path for Next.js
    const dbPath = path.resolve(process.cwd(), 'src/db/reconnect.db');
    const db = new Database(dbPath);

    try {
      // First check if the tech_id exists
      const techExists = db.prepare('SELECT tech_id FROM hil_technology WHERE tech_id = ?').get(body.tech_id);
      if (!techExists) {
        return NextResponse.json(
          { error: 'HIL Technology entry not found' },
          { status: 404 }
        );
      }

      // Check if the bench_id exists
      const benchExists = db.prepare('SELECT bench_id FROM test_benches WHERE bench_id = ?').get(body.bench_id);
      if (!benchExists) {
        return NextResponse.json(
          { error: 'Test Bench not found' },
          { status: 400 }
        );
      }

      // Start a transaction
      db.exec('BEGIN TRANSACTION');
      
      // Update the hil_technology record
      db.prepare(`
        UPDATE hil_technology SET
          bench_id = ?, 
          fiu_info = ?, 
          io_info = ?,
          can_interface = ?,
          power_interface = ?,
          possible_tests = ?,
          leakage_module = ?
        WHERE tech_id = ?
      `).run(
        body.bench_id,
        body.fiu_info || null,
        body.io_info || null,
        body.can_interface || null,
        body.power_interface || null,
        body.possible_tests || null,
        body.leakage_module || null,
        body.tech_id
      );
      
      // Commit the transaction
      db.exec('COMMIT');
      
      // Get the updated technology entry with test bench info
      const updatedTechnology = db.prepare(`
        SELECT h.*, t.hil_name 
        FROM hil_technology h
        LEFT JOIN test_benches t ON h.bench_id = t.bench_id
        WHERE h.tech_id = ?
      `).get(body.tech_id);
      
      // Close the database connection
      db.close();
      
      return NextResponse.json({ 
        success: true, 
        message: 'HIL technology updated successfully',
        technology: updatedTechnology
      });
    } catch (error) {
      // Rollback on error
      db.exec('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating HIL technology:', error);
    return NextResponse.json(
      { error: 'Failed to update HIL technology: ' + error.message },
      { status: 500 }
    );
  }
} 