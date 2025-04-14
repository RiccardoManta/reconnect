import { NextResponse } from 'next/server';
const Database = require('better-sqlite3');
const path = require('path');

// GET method to fetch all users
export async function GET() {
  try {
    // Use absolute path for Next.js
    const dbPath = path.resolve(process.cwd(), 'src/db/reconnect.db');
    const db = new Database(dbPath);
    
    // Get all users
    const users = db.prepare('SELECT * FROM users ORDER BY user_id').all();
    
    // Close the database connection
    db.close();
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
} 

// POST method to add a new user
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.user_name) {
      return NextResponse.json(
        { error: 'User Name is required' },
        { status: 400 }
      );
    }

    // Use absolute path for Next.js
    const dbPath = path.resolve(process.cwd(), 'src/db/reconnect.db');
    const db = new Database(dbPath);

    try {
      // Start a transaction
      db.exec('BEGIN TRANSACTION');
      
      // Insert into users table
      const result = db.prepare(`
        INSERT INTO users (
          user_name, 
          contact_info
        ) VALUES (?, ?)
      `).run(
        body.user_name,
        body.contact_info || null
      );
      
      // Commit the transaction
      db.exec('COMMIT');
      
      // Get the newly added user
      const newUser = db.prepare(`
        SELECT * FROM users WHERE user_id = ?
      `).get(result.lastInsertRowid);
      
      // Close the database connection
      db.close();
      
      return NextResponse.json({ 
        success: true, 
        message: 'User added successfully',
        user: newUser
      });
    } catch (error) {
      // Rollback on error
      db.exec('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error adding user:', error);
    return NextResponse.json(
      { error: 'Failed to add user: ' + error.message },
      { status: 500 }
    );
  }
}

// PUT method to update an existing user
export async function PUT(request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!body.user_name) {
      return NextResponse.json(
        { error: 'User Name is required' },
        { status: 400 }
      );
    }

    // Use absolute path for Next.js
    const dbPath = path.resolve(process.cwd(), 'src/db/reconnect.db');
    const db = new Database(dbPath);

    try {
      // Start a transaction
      db.exec('BEGIN TRANSACTION');
      
      // Update the user record
      db.prepare(`
        UPDATE users SET
          user_name = ?, 
          contact_info = ?
        WHERE user_id = ?
      `).run(
        body.user_name,
        body.contact_info || null,
        body.user_id
      );
      
      // Commit the transaction
      db.exec('COMMIT');
      
      // Get the updated user
      const updatedUser = db.prepare(`
        SELECT * FROM users WHERE user_id = ?
      `).get(body.user_id);
      
      // Close the database connection
      db.close();
      
      return NextResponse.json({ 
        success: true, 
        message: 'User updated successfully',
        user: updatedUser
      });
    } catch (error) {
      // Rollback on error
      db.exec('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user: ' + error.message },
      { status: 500 }
    );
  }
} 