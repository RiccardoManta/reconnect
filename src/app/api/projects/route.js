import { NextResponse } from 'next/server';
const Database = require('better-sqlite3');
const path = require('path');

// GET method to fetch all projects
export async function GET() {
  try {
    // Use absolute path for Next.js
    const dbPath = path.resolve(process.cwd(), 'src/db/reconnect.db');
    const db = new Database(dbPath);
    
    // Get all projects
    const projects = db.prepare('SELECT * FROM projects ORDER BY project_id').all();
    
    // Close the database connection
    db.close();
    
    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
} 

// POST method to add a new project
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.project_name) {
      return NextResponse.json(
        { error: 'Project Name is required' },
        { status: 400 }
      );
    }

    // Use absolute path for Next.js
    const dbPath = path.resolve(process.cwd(), 'src/db/reconnect.db');
    const db = new Database(dbPath);

    try {
      // Start a transaction
      db.exec('BEGIN TRANSACTION');
      
      // Insert into projects table
      const result = db.prepare(`
        INSERT INTO projects (
          project_number, 
          project_name
        ) VALUES (?, ?)
      `).run(
        body.project_number || null,
        body.project_name
      );
      
      // Commit the transaction
      db.exec('COMMIT');
      
      // Get the newly added project
      const newProject = db.prepare(`
        SELECT * FROM projects WHERE project_id = ?
      `).get(result.lastInsertRowid);
      
      // Close the database connection
      db.close();
      
      return NextResponse.json({ 
        success: true, 
        message: 'Project added successfully',
        project: newProject
      });
    } catch (error) {
      // Rollback on error
      db.exec('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error adding project:', error);
    return NextResponse.json(
      { error: 'Failed to add project: ' + error.message },
      { status: 500 }
    );
  }
}

// PUT method to update an existing project
export async function PUT(request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.project_id) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    if (!body.project_name) {
      return NextResponse.json(
        { error: 'Project Name is required' },
        { status: 400 }
      );
    }

    // Use absolute path for Next.js
    const dbPath = path.resolve(process.cwd(), 'src/db/reconnect.db');
    const db = new Database(dbPath);

    try {
      // Start a transaction
      db.exec('BEGIN TRANSACTION');
      
      // Update the project record
      db.prepare(`
        UPDATE projects SET
          project_number = ?, 
          project_name = ?
        WHERE project_id = ?
      `).run(
        body.project_number || null,
        body.project_name,
        body.project_id
      );
      
      // Commit the transaction
      db.exec('COMMIT');
      
      // Get the updated project
      const updatedProject = db.prepare(`
        SELECT * FROM projects WHERE project_id = ?
      `).get(body.project_id);
      
      // Close the database connection
      db.close();
      
      return NextResponse.json({ 
        success: true, 
        message: 'Project updated successfully',
        project: updatedProject
      });
    } catch (error) {
      // Rollback on error
      db.exec('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project: ' + error.message },
      { status: 500 }
    );
  }
} 