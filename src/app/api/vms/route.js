import { NextResponse } from 'next/server';
const Database = require('better-sqlite3');
const path = require('path');

// GET method to fetch all VM instances
export async function GET() {
  try {
    // Use absolute path for Next.js - updated to match actual location
    const dbPath = path.resolve(process.cwd(), 'reconnect.db');
    const db = new Database(dbPath);
    
    // Get all VM instances
    const vmInstances = db.prepare('SELECT * FROM vm_instances ORDER BY vm_id').all();
    
    // Close the database connection
    db.close();
    
    return NextResponse.json({ vmInstances });
  } catch (error) {
    console.error('Error fetching VM instances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch VM instances' },
      { status: 500 }
    );
  }
}

// POST method to add a new VM instance
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.vm_name) {
      return NextResponse.json(
        { error: 'VM Name is required' },
        { status: 400 }
      );
    }

    // Use absolute path for Next.js - updated to match actual location
    const dbPath = path.resolve(process.cwd(), 'reconnect.db');
    const db = new Database(dbPath);

    try {
      // Start a transaction
      db.exec('BEGIN TRANSACTION');
      
      // Insert into vm_instances table
      const result = db.prepare(`
        INSERT INTO vm_instances (
          vm_name, 
          vm_address, 
          installed_tools
        ) VALUES (?, ?, ?)
      `).run(
        body.vm_name,
        body.vm_address || null,
        body.installed_tools || null
      );
      
      // Commit the transaction
      db.exec('COMMIT');
      
      // Get the newly added VM instance
      const newVmInstance = db.prepare(`
        SELECT * FROM vm_instances WHERE vm_id = ?
      `).get(result.lastInsertRowid);
      
      // Close the database connection
      db.close();
      
      return NextResponse.json({ 
        success: true, 
        message: 'VM instance added successfully',
        vmInstance: newVmInstance
      });
    } catch (error) {
      // Rollback on error
      db.exec('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error adding VM instance:', error);
    return NextResponse.json(
      { error: 'Failed to add VM instance: ' + error.message },
      { status: 500 }
    );
  }
}

// PUT method to update an existing VM instance
export async function PUT(request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.vm_id) {
      return NextResponse.json(
        { error: 'VM ID is required' },
        { status: 400 }
      );
    }

    if (!body.vm_name) {
      return NextResponse.json(
        { error: 'VM Name is required' },
        { status: 400 }
      );
    }

    // Use absolute path for Next.js - updated to match actual location
    const dbPath = path.resolve(process.cwd(), 'reconnect.db');
    const db = new Database(dbPath);

    try {
      // Start a transaction
      db.exec('BEGIN TRANSACTION');
      
      // Update the VM instance record
      db.prepare(`
        UPDATE vm_instances SET
          vm_name = ?, 
          vm_address = ?, 
          installed_tools = ?
        WHERE vm_id = ?
      `).run(
        body.vm_name,
        body.vm_address || null,
        body.installed_tools || null,
        body.vm_id
      );
      
      // Commit the transaction
      db.exec('COMMIT');
      
      // Get the updated VM instance
      const updatedVmInstance = db.prepare(`
        SELECT * FROM vm_instances WHERE vm_id = ?
      `).get(body.vm_id);
      
      // Close the database connection
      db.close();
      
      return NextResponse.json({ 
        success: true, 
        message: 'VM instance updated successfully',
        vmInstance: updatedVmInstance
      });
    } catch (error) {
      // Rollback on error
      db.exec('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating VM instance:', error);
    return NextResponse.json(
      { error: 'Failed to update VM instance: ' + error.message },
      { status: 500 }
    );
  }
} 