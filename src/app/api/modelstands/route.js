import { NextResponse } from 'next/server';
const Database = require('better-sqlite3');
const path = require('path');

// GET method to fetch all model stands
export async function GET() {
  try {
    // Use absolute path for Next.js
    const dbPath = path.resolve(process.cwd(), 'src/db/reconnect.db');
    const db = new Database(dbPath);
    
    // Get all model stands
    const modelStands = db.prepare('SELECT * FROM model_stands ORDER BY model_id').all();
    
    // Close the database connection
    db.close();
    
    return NextResponse.json({ modelStands });
  } catch (error) {
    console.error('Error fetching model stands:', error);
    return NextResponse.json(
      { error: 'Failed to fetch model stands' },
      { status: 500 }
    );
  }
} 

// POST method to add a new model stand
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.model_name) {
      return NextResponse.json(
        { error: 'Model Name is required' },
        { status: 400 }
      );
    }

    // Use absolute path for Next.js
    const dbPath = path.resolve(process.cwd(), 'src/db/reconnect.db');
    const db = new Database(dbPath);

    try {
      // Start a transaction
      db.exec('BEGIN TRANSACTION');
      
      // Insert into model_stands table
      const result = db.prepare(`
        INSERT INTO model_stands (
          model_name, 
          svn_link, 
          features
        ) VALUES (?, ?, ?)
      `).run(
        body.model_name,
        body.svn_link || null,
        body.features || null
      );
      
      // Commit the transaction
      db.exec('COMMIT');
      
      // Get the newly added model stand
      const newModelStand = db.prepare(`
        SELECT * FROM model_stands WHERE model_id = ?
      `).get(result.lastInsertRowid);
      
      // Close the database connection
      db.close();
      
      return NextResponse.json({ 
        success: true, 
        message: 'Model stand added successfully',
        modelStand: newModelStand
      });
    } catch (error) {
      // Rollback on error
      db.exec('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error adding model stand:', error);
    return NextResponse.json(
      { error: 'Failed to add model stand: ' + error.message },
      { status: 500 }
    );
  }
}

// PUT method to update an existing model stand
export async function PUT(request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.model_id) {
      return NextResponse.json(
        { error: 'Model ID is required' },
        { status: 400 }
      );
    }

    if (!body.model_name) {
      return NextResponse.json(
        { error: 'Model Name is required' },
        { status: 400 }
      );
    }

    // Use absolute path for Next.js
    const dbPath = path.resolve(process.cwd(), 'src/db/reconnect.db');
    const db = new Database(dbPath);

    try {
      // Start a transaction
      db.exec('BEGIN TRANSACTION');
      
      // Update the model stand record
      db.prepare(`
        UPDATE model_stands SET
          model_name = ?, 
          svn_link = ?, 
          features = ?
        WHERE model_id = ?
      `).run(
        body.model_name,
        body.svn_link || null,
        body.features || null,
        body.model_id
      );
      
      // Commit the transaction
      db.exec('COMMIT');
      
      // Get the updated model stand
      const updatedModelStand = db.prepare(`
        SELECT * FROM model_stands WHERE model_id = ?
      `).get(body.model_id);
      
      // Close the database connection
      db.close();
      
      return NextResponse.json({ 
        success: true, 
        message: 'Model stand updated successfully',
        modelStand: updatedModelStand
      });
    } catch (error) {
      // Rollback on error
      db.exec('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating model stand:', error);
    return NextResponse.json(
      { error: 'Failed to update model stand: ' + error.message },
      { status: 500 }
    );
  }
} 