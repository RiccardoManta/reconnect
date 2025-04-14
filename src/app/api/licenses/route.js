import { NextResponse } from 'next/server';
const Database = require('better-sqlite3');
const path = require('path');

// GET method to fetch all licenses
export async function GET() {
  try {
    // Use absolute path for Next.js
    const dbPath = path.resolve(process.cwd(), 'src/db/reconnect.db');
    const db = new Database(dbPath);
    
    // Get all licenses
    const licenses = db.prepare('SELECT * FROM licenses ORDER BY license_id').all();
    
    // Close the database connection
    db.close();
    
    return NextResponse.json({ licenses });
  } catch (error) {
    console.error('Error fetching licenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch licenses' },
      { status: 500 }
    );
  }
} 

// POST method to add a new license
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.tool_name) {
      return NextResponse.json(
        { error: 'Tool Name is required' },
        { status: 400 }
      );
    }

    // Use absolute path for Next.js
    const dbPath = path.resolve(process.cwd(), 'src/db/reconnect.db');
    const db = new Database(dbPath);

    try {
      // Start a transaction
      db.exec('BEGIN TRANSACTION');
      
      // Insert into licenses table
      const result = db.prepare(`
        INSERT INTO licenses (
          tool_name, 
          license_number, 
          maintenance_end, 
          owner,
          assigned_pc_id
        ) VALUES (?, ?, ?, ?, ?)
      `).run(
        body.tool_name,
        body.license_number || null,
        body.maintenance_end || null,
        body.owner || null,
        body.assigned_pc_id || null
      );
      
      // Commit the transaction
      db.exec('COMMIT');
      
      // Get the newly added license
      const newLicense = db.prepare(`
        SELECT * FROM licenses WHERE license_id = ?
      `).get(result.lastInsertRowid);
      
      // Close the database connection
      db.close();
      
      return NextResponse.json({ 
        success: true, 
        message: 'License added successfully',
        license: newLicense
      });
    } catch (error) {
      // Rollback on error
      db.exec('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error adding license:', error);
    return NextResponse.json(
      { error: 'Failed to add license: ' + error.message },
      { status: 500 }
    );
  }
}

// PUT method to update an existing license
export async function PUT(request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.license_id) {
      return NextResponse.json(
        { error: 'License ID is required' },
        { status: 400 }
      );
    }

    if (!body.tool_name) {
      return NextResponse.json(
        { error: 'Tool Name is required' },
        { status: 400 }
      );
    }

    // Use absolute path for Next.js
    const dbPath = path.resolve(process.cwd(), 'src/db/reconnect.db');
    const db = new Database(dbPath);

    try {
      // Start a transaction
      db.exec('BEGIN TRANSACTION');
      
      // Update the license record
      db.prepare(`
        UPDATE licenses SET
          tool_name = ?, 
          license_number = ?, 
          maintenance_end = ?, 
          owner = ?,
          assigned_pc_id = ?
        WHERE license_id = ?
      `).run(
        body.tool_name,
        body.license_number || null,
        body.maintenance_end || null,
        body.owner || null,
        body.assigned_pc_id || null,
        body.license_id
      );
      
      // Commit the transaction
      db.exec('COMMIT');
      
      // Get the updated license
      const updatedLicense = db.prepare(`
        SELECT * FROM licenses WHERE license_id = ?
      `).get(body.license_id);
      
      // Close the database connection
      db.close();
      
      return NextResponse.json({ 
        success: true, 
        message: 'License updated successfully',
        license: updatedLicense
      });
    } catch (error) {
      // Rollback on error
      db.exec('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating license:', error);
    return NextResponse.json(
      { error: 'Failed to update license: ' + error.message },
      { status: 500 }
    );
  }
} 