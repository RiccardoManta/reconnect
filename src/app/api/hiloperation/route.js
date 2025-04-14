import { NextResponse } from 'next/server';
const Database = require('better-sqlite3');
const path = require('path');

// GET method to fetch all HIL operation data
export async function GET() {
  try {
    // Use absolute path for Next.js
    const dbPath = path.resolve(process.cwd(), 'src/db/reconnect.db');
    const db = new Database(dbPath);
    
    // Get all HIL operation data with test bench info
    const operations = db.prepare(`
      SELECT o.*, t.hil_name
      FROM hil_operation o
      LEFT JOIN test_benches t ON o.bench_id = t.bench_id
      ORDER BY o.operation_id
    `).all();
    
    // Close the database connection
    db.close();
    
    return NextResponse.json({ operations });
  } catch (error) {
    console.error('Error fetching HIL operation data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch HIL operation data' },
      { status: 500 }
    );
  }
}

// POST method to add a new HIL operation entry
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
      
      // Insert into hil_operation table
      const result = db.prepare(`
        INSERT INTO hil_operation (
          bench_id, 
          possible_tests, 
          vehicle_datasets,
          scenarios,
          controldesk_projects
        ) VALUES (?, ?, ?, ?, ?)
      `).run(
        body.bench_id,
        body.possible_tests || null,
        body.vehicle_datasets || null,
        body.scenarios || null,
        body.controldesk_projects || null
      );
      
      // Commit the transaction
      db.exec('COMMIT');
      
      // Get the newly added operation entry with test bench info
      const newOperation = db.prepare(`
        SELECT o.*, t.hil_name
        FROM hil_operation o
        LEFT JOIN test_benches t ON o.bench_id = t.bench_id
        WHERE o.operation_id = ?
      `).get(result.lastInsertRowid);
      
      // Close the database connection
      db.close();
      
      return NextResponse.json({ 
        success: true, 
        message: 'HIL operation added successfully',
        operation: newOperation
      });
    } catch (error) {
      // Rollback on error
      db.exec('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error adding HIL operation:', error);
    return NextResponse.json(
      { error: 'Failed to add HIL operation: ' + error.message },
      { status: 500 }
    );
  }
}

// PUT method to update an existing HIL operation entry
export async function PUT(request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.operation_id) {
      return NextResponse.json(
        { error: 'Operation ID is required' },
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
      // First check if the operation_id exists
      const operationExists = db.prepare('SELECT operation_id FROM hil_operation WHERE operation_id = ?').get(body.operation_id);
      if (!operationExists) {
        return NextResponse.json(
          { error: 'HIL Operation entry not found' },
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
      
      // Update the hil_operation record
      db.prepare(`
        UPDATE hil_operation SET
          bench_id = ?, 
          possible_tests = ?, 
          vehicle_datasets = ?,
          scenarios = ?,
          controldesk_projects = ?
        WHERE operation_id = ?
      `).run(
        body.bench_id,
        body.possible_tests || null,
        body.vehicle_datasets || null,
        body.scenarios || null,
        body.controldesk_projects || null,
        body.operation_id
      );
      
      // Commit the transaction
      db.exec('COMMIT');
      
      // Get the updated operation entry with test bench info
      const updatedOperation = db.prepare(`
        SELECT o.*, t.hil_name
        FROM hil_operation o
        LEFT JOIN test_benches t ON o.bench_id = t.bench_id
        WHERE o.operation_id = ?
      `).get(body.operation_id);
      
      // Close the database connection
      db.close();
      
      return NextResponse.json({ 
        success: true, 
        message: 'HIL operation updated successfully',
        operation: updatedOperation
      });
    } catch (error) {
      // Rollback on error
      db.exec('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating HIL operation:', error);
    return NextResponse.json(
      { error: 'Failed to update HIL operation: ' + error.message },
      { status: 500 }
    );
  }
} 