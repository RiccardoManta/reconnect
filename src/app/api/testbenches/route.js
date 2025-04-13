import { NextResponse } from 'next/server';
const Database = require('better-sqlite3');
const path = require('path');

// GET method to fetch all test benches
export async function GET() {
  try {
    // Use absolute path for Next.js
    const dbPath = path.resolve(process.cwd(), 'src/db/reconnect.db');
    const db = new Database(dbPath);
    
    // Get test bench data with joined user and project info
    const testBenches = db.prepare(`
      SELECT 
        t.bench_id,
        t.hil_name,
        t.pp_number,
        t.system_type,
        t.bench_type,
        t.acquisition_date,
        t.location,
        u.user_id,
        u.user_name,
        p.project_id,
        p.project_name
      FROM test_benches t
      LEFT JOIN users u ON t.user_id = u.user_id
      LEFT JOIN projects p ON t.project_id = p.project_id
      ORDER BY t.bench_id
    `).all();
    
    // Close the database connection
    db.close();
    
    return NextResponse.json({ testBenches });
  } catch (error) {
    console.error('Error fetching test benches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test benches' },
      { status: 500 }
    );
  }
}

// POST method to add a new test bench
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.hil_name) {
      return NextResponse.json(
        { error: 'HIL Name is required' },
        { status: 400 }
      );
    }

    // Use absolute path for Next.js
    const dbPath = path.resolve(process.cwd(), 'src/db/reconnect.db');
    const db = new Database(dbPath);

    try {
      // Start a transaction
      db.exec('BEGIN TRANSACTION');
      
      // Insert into test_benches table
      const result = db.prepare(`
        INSERT INTO test_benches (
          hil_name, 
          pp_number, 
          system_type, 
          bench_type, 
          acquisition_date, 
          location, 
          user_id, 
          project_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        body.hil_name,
        body.pp_number || null,
        body.system_type || null,
        body.bench_type || null,
        body.acquisition_date || null,
        body.location || null,
        body.user_id || null,
        body.project_id || null
      );
      
      // Commit the transaction
      db.exec('COMMIT');
      
      // Get the newly added test bench
      const newTestBench = db.prepare(`
        SELECT 
          t.bench_id,
          t.hil_name,
          t.pp_number,
          t.system_type,
          t.bench_type,
          t.acquisition_date,
          t.location,
          u.user_id,
          u.user_name,
          p.project_id,
          p.project_name
        FROM test_benches t
        LEFT JOIN users u ON t.user_id = u.user_id
        LEFT JOIN projects p ON t.project_id = p.project_id
        WHERE t.bench_id = ?
      `).get(result.lastInsertRowid);
      
      // Close the database connection
      db.close();
      
      return NextResponse.json({ 
        success: true, 
        message: 'Test bench added successfully',
        testBench: newTestBench
      });
    } catch (error) {
      // Rollback on error
      db.exec('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error adding test bench:', error);
    return NextResponse.json(
      { error: 'Failed to add test bench: ' + error.message },
      { status: 500 }
    );
  }
}

// PUT method to update an existing test bench
export async function PUT(request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.bench_id) {
      return NextResponse.json(
        { error: 'Bench ID is required' },
        { status: 400 }
      );
    }

    if (!body.hil_name) {
      return NextResponse.json(
        { error: 'HIL Name is required' },
        { status: 400 }
      );
    }

    // Use absolute path for Next.js
    const dbPath = path.resolve(process.cwd(), 'src/db/reconnect.db');
    const db = new Database(dbPath);

    try {
      // Start a transaction
      db.exec('BEGIN TRANSACTION');
      
      // Update the test bench record
      db.prepare(`
        UPDATE test_benches SET
          hil_name = ?, 
          pp_number = ?, 
          system_type = ?, 
          bench_type = ?, 
          acquisition_date = ?, 
          location = ?, 
          user_id = ?, 
          project_id = ?
        WHERE bench_id = ?
      `).run(
        body.hil_name,
        body.pp_number || null,
        body.system_type || null,
        body.bench_type || null,
        body.acquisition_date || null,
        body.location || null,
        body.user_id || null,
        body.project_id || null,
        body.bench_id
      );
      
      // Commit the transaction
      db.exec('COMMIT');
      
      // Get the updated test bench
      const updatedTestBench = db.prepare(`
        SELECT 
          t.bench_id,
          t.hil_name,
          t.pp_number,
          t.system_type,
          t.bench_type,
          t.acquisition_date,
          t.location,
          u.user_id,
          u.user_name,
          p.project_id,
          p.project_name
        FROM test_benches t
        LEFT JOIN users u ON t.user_id = u.user_id
        LEFT JOIN projects p ON t.project_id = p.project_id
        WHERE t.bench_id = ?
      `).get(body.bench_id);
      
      // Close the database connection
      db.close();
      
      return NextResponse.json({ 
        success: true, 
        message: 'Test bench updated successfully',
        testBench: updatedTestBench
      });
    } catch (error) {
      // Rollback on error
      db.exec('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating test bench:', error);
    return NextResponse.json(
      { error: 'Failed to update test bench: ' + error.message },
      { status: 500 }
    );
  }
} 