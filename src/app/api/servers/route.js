import { NextResponse } from 'next/server';
const Database = require('better-sqlite3');
const path = require('path');

// GET method to fetch all servers with joined data
export async function GET() {
  try {
    // Use absolute path for Next.js
    const dbPath = path.resolve(process.cwd(), 'src/db/reconnect.db');
    const db = new Database(dbPath);
    
    // Get server data with proper mappings:
    // - Platform from test_bench_project_overview as category
    // - bench_type kept as subcategory
    const servers = db.prepare(`
      SELECT 
        t.bench_id,
        t.hil_name,
        o.platform AS category,
        t.bench_type AS subcategory,
        p.pc_info_text AS description,
        p.status,
        p.active_user,
        t.location
      FROM test_benches t
      LEFT JOIN pc_overview p ON t.bench_id = p.bench_id
      LEFT JOIN test_bench_project_overview o ON t.bench_id = o.bench_id
      ORDER BY t.bench_id
    `).all();
    
    // Close the database connection
    db.close();
    
    return NextResponse.json({ servers });
  } catch (error) {
    console.error('Error fetching server data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch server data' },
      { status: 500 }
    );
  }
}

// POST method to add a new server
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Server name is required' },
        { status: 400 }
      );
    }

    // Use absolute path for Next.js
    const dbPath = path.resolve(process.cwd(), 'src/db/reconnect.db');
    const db = new Database(dbPath);

    // Start a transaction
    db.exec('BEGIN TRANSACTION');
    
    try {
      // 1. Insert into test_benches table
      const testBenchResult = db.prepare(`
        INSERT INTO test_benches (
          hil_name, 
          bench_type, 
          system_type
        ) VALUES (?, ?, ?)
      `).run(
        body.name,
        body.bench_type || null, // Using bench_type as bench_type
        body.bench_type || null  // Using bench_type as system_type (can be adjusted)
      );
      
      const benchId = testBenchResult.lastInsertRowid;
      
      // 2. Insert into test_bench_project_overview table
      db.prepare(`
        INSERT INTO test_bench_project_overview (
          bench_id,
          platform
        ) VALUES (?, ?)
      `).run(benchId, body.platform || 'Uncategorized');
      
      // 3. Insert into pc_overview table
      db.prepare(`
        INSERT INTO pc_overview (
          bench_id,
          pc_info_text,
          status,
          active_user
        ) VALUES (?, ?, ?, ?)
      `).run(
        benchId,
        body.description || null,
        body.status || 'online', // Default to 'online' if not provided
        body.user || null        // Default to null if not provided
      );
      
      // Commit the transaction
      db.exec('COMMIT');
      
      // Get the newly added server with all joined data
      const newServer = db.prepare(`
        SELECT 
          t.bench_id,
          t.hil_name,
          o.platform AS category,
          t.bench_type AS subcategory,
          p.pc_info_text AS description,
          p.status,
          p.active_user,
          t.location
        FROM test_benches t
        LEFT JOIN pc_overview p ON t.bench_id = p.bench_id
        LEFT JOIN test_bench_project_overview o ON t.bench_id = o.bench_id
        WHERE t.bench_id = ?
      `).get(benchId);
      
      // Close the database connection
      db.close();
      
      return NextResponse.json({ 
        success: true, 
        message: 'Server added successfully',
        server: newServer
      });
      
    } catch (innerError) {
      // Rollback the transaction on error
      db.exec('ROLLBACK');
      throw innerError;
    }
    
  } catch (error) {
    console.error('Error adding server:', error);
    return NextResponse.json(
      { error: 'Failed to add server: ' + error.message },
      { status: 500 }
    );
  }
} 