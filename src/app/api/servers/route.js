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
        p.pc_name AS hil_name,
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
          pc_name,
          pc_info_text,
          status,
          active_user
        ) VALUES (?, ?, ?, ?, ?)
      `).run(
        benchId,
        body.name || null,
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
          p.pc_name AS hil_name,
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

// PUT method to update an existing server
export async function PUT(request) {
  const url = new URL(request.url);
  const benchId = url.searchParams.get('id');

  if (!benchId) {
    return NextResponse.json({ error: 'Bench ID is required for update' }, { status: 400 });
  }

  const numericBenchId = parseInt(benchId, 10);
  if (isNaN(numericBenchId)) {
    return NextResponse.json({ error: 'Invalid Bench ID format' }, { status: 400 });
  }

  try {
    const body = await request.json();
    
    // Validate required fields (adjust as needed based on what MUST be present for an update)
    if (!body.name) {
      return NextResponse.json({ error: 'PC name is required' }, { status: 400 });
    }

    // Use absolute path for Next.js
    const dbPath = path.resolve(process.cwd(), 'src/db/reconnect.db');
    const db = new Database(dbPath);

    // Start a transaction
    db.exec('BEGIN TRANSACTION');
    
    try {
      // Check if the server exists
      const serverExists = db.prepare('SELECT bench_id FROM test_benches WHERE bench_id = ?').get(numericBenchId);
      if (!serverExists) {
        db.close();
        return NextResponse.json({ error: 'Server not found' }, { status: 404 });
      }

      // 1. Update test_benches table
      db.prepare(`
        UPDATE test_benches 
        SET hil_name = ?, bench_type = ?, system_type = ?
        WHERE bench_id = ?
      `).run(
        body.name, // Still update hil_name for consistency or other potential uses
        body.bench_type || null,
        body.bench_type || null, // Assuming system_type follows bench_type
        numericBenchId
      );
      
      // 2. Update test_bench_project_overview table (handle potential existing record)
      const overviewExists = db.prepare('SELECT bench_id FROM test_bench_project_overview WHERE bench_id = ?').get(numericBenchId);
      if (overviewExists) {
         db.prepare(`
          UPDATE test_bench_project_overview SET platform = ?
          WHERE bench_id = ?
        `).run(body.platform || 'Uncategorized', numericBenchId);
      } else {
        // If somehow missing, insert it
        db.prepare(`
          INSERT INTO test_bench_project_overview (bench_id, platform) VALUES (?, ?)
        `).run(numericBenchId, body.platform || 'Uncategorized');
      }
     
      // 3. Update pc_overview table (handle potential existing record)
      const pcExists = db.prepare('SELECT bench_id FROM pc_overview WHERE bench_id = ?').get(numericBenchId);
       if (pcExists) {
         db.prepare(`
          UPDATE pc_overview 
          SET pc_name = ?, pc_info_text = ?, status = ?, active_user = ?
          WHERE bench_id = ?
        `).run(
          body.name || null, // Update pc_name
          body.description || null,
          body.status || 'online',
          body.user || null,
          numericBenchId
        );
       } else {
         // If somehow missing, insert it
         db.prepare(`
          INSERT INTO pc_overview (bench_id, pc_name, pc_info_text, status, active_user) VALUES (?, ?, ?, ?, ?)
        `).run(numericBenchId, body.name || null, body.description || null, body.status || 'online', body.user || null);
       }
      
      // Commit the transaction
      db.exec('COMMIT');
      
      // Get the updated server with all joined data (using the original GET query structure for consistency)
      const updatedServer = db.prepare(`
        SELECT 
          t.bench_id,
          p.pc_name AS hil_name,
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
      `).get(numericBenchId);
      
      db.close();
      
      return NextResponse.json({ 
        success: true, 
        message: 'Server updated successfully',
        server: updatedServer
      });
      
    } catch (innerError) {
      db.exec('ROLLBACK');
      throw innerError;
    }
    
  } catch (error) {
    db.close(); // Ensure DB is closed on outer error too
    console.error('Error updating server:', error);
    return NextResponse.json(
      { error: 'Failed to update server: ' + error.message },
      { status: 500 }
    );
  }
}

// DELETE method to remove a server and related data
export async function DELETE(request) {
  const url = new URL(request.url);
  const benchId = url.searchParams.get('id');

  if (!benchId) {
    return NextResponse.json({ error: 'Bench ID is required' }, { status: 400 });
  }

  const numericBenchId = parseInt(benchId, 10);
  if (isNaN(numericBenchId)) {
    return NextResponse.json({ error: 'Invalid Bench ID format' }, { status: 400 });
  }

  // Use absolute path for Next.js
  const dbPath = path.resolve(process.cwd(), 'src/db/reconnect.db');
  const db = new Database(dbPath);

  // Start a transaction
  db.exec('BEGIN TRANSACTION');

  try {
    // Delete associated records (order might matter depending on constraints, or use CASCADE)
    // Consider adding deletions for other related tables if necessary (hil_technology, etc.)
    db.prepare('DELETE FROM pc_overview WHERE bench_id = ?').run(numericBenchId);
    db.prepare('DELETE FROM test_bench_project_overview WHERE bench_id = ?').run(numericBenchId);
    // Finally delete from the main test_benches table
    const result = db.prepare('DELETE FROM test_benches WHERE bench_id = ?').run(numericBenchId);

    // Commit the transaction
    db.exec('COMMIT');
    db.close();

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Server deleted successfully' });

  } catch (error) {
    // Rollback on error
    db.exec('ROLLBACK');
    db.close();
    console.error('Error deleting server:', error);
    return NextResponse.json(
      { error: 'Failed to delete server: ' + error.message },
      { status: 500 }
    );
  }
} 