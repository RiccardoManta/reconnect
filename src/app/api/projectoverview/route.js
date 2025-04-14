import { NextResponse } from 'next/server';
const Database = require('better-sqlite3');
const path = require('path');

// GET method to fetch all test bench project overview data
export async function GET() {
  try {
    // Use absolute path for Next.js
    const dbPath = path.resolve(process.cwd(), 'src/db/reconnect.db');
    const db = new Database(dbPath);
    
    // Get all project overview data with test bench info
    const projectOverviews = db.prepare(`
      SELECT o.*, t.hil_name
      FROM test_bench_project_overview o
      LEFT JOIN test_benches t ON o.bench_id = t.bench_id
      ORDER BY o.overview_id
    `).all();
    
    // Close the database connection
    db.close();
    
    return NextResponse.json({ projectOverviews });
  } catch (error) {
    console.error('Error fetching test bench project overview data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test bench project overview data' },
      { status: 500 }
    );
  }
}

// POST method to add a new test bench project overview
export async function POST(request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.bench_id) {
      return NextResponse.json(
        { error: 'Test bench ID is required' },
        { status: 400 }
      );
    }
    
    // Use absolute path for Next.js
    const dbPath = path.resolve(process.cwd(), 'src/db/reconnect.db');
    const db = new Database(dbPath);
    
    // Get the test bench info to include the name in the response
    const testBench = db.prepare(`
      SELECT hil_name FROM test_benches WHERE bench_id = ?
    `).get(data.bench_id);
    
    if (!testBench) {
      db.close();
      return NextResponse.json(
        { error: 'Test bench not found' },
        { status: 404 }
      );
    }
    
    // Insert the new project overview record
    const result = db.prepare(`
      INSERT INTO test_bench_project_overview (
        bench_id, 
        platform, 
        system_supplier, 
        wetbench_info, 
        actuator_info, 
        hardware, 
        software, 
        model_version, 
        ticket_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.bench_id,
      data.platform || '',
      data.system_supplier || '',
      data.wetbench_info || '',
      data.actuator_info || '',
      data.hardware || '',
      data.software || '',
      data.model_version || '',
      data.ticket_notes || ''
    );
    
    // Get the newly inserted record
    const newOverview = db.prepare(`
      SELECT o.*, t.hil_name
      FROM test_bench_project_overview o
      LEFT JOIN test_benches t ON o.bench_id = t.bench_id
      WHERE o.overview_id = ?
    `).get(result.lastInsertRowid);
    
    // Close the database connection
    db.close();
    
    return NextResponse.json({ 
      message: 'Project overview added successfully',
      projectOverview: newOverview
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error adding project overview:', error);
    return NextResponse.json(
      { error: 'Failed to add project overview' },
      { status: 500 }
    );
  }
}

// PUT method to update an existing test bench project overview
export async function PUT(request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.overview_id) {
      return NextResponse.json(
        { error: 'Overview ID is required' },
        { status: 400 }
      );
    }
    
    if (!data.bench_id) {
      return NextResponse.json(
        { error: 'Test bench ID is required' },
        { status: 400 }
      );
    }
    
    // Use absolute path for Next.js
    const dbPath = path.resolve(process.cwd(), 'src/db/reconnect.db');
    const db = new Database(dbPath);
    
    // Check if the project overview exists
    const existingOverview = db.prepare(`
      SELECT * FROM test_bench_project_overview WHERE overview_id = ?
    `).get(data.overview_id);
    
    if (!existingOverview) {
      db.close();
      return NextResponse.json(
        { error: 'Project overview record not found' },
        { status: 404 }
      );
    }
    
    // Check if the test bench exists
    const testBench = db.prepare(`
      SELECT hil_name FROM test_benches WHERE bench_id = ?
    `).get(data.bench_id);
    
    if (!testBench) {
      db.close();
      return NextResponse.json(
        { error: 'Test bench not found' },
        { status: 404 }
      );
    }
    
    // Update the project overview record
    db.prepare(`
      UPDATE test_bench_project_overview
      SET bench_id = ?,
          platform = ?,
          system_supplier = ?,
          wetbench_info = ?,
          actuator_info = ?,
          hardware = ?,
          software = ?,
          model_version = ?,
          ticket_notes = ?
      WHERE overview_id = ?
    `).run(
      data.bench_id,
      data.platform || '',
      data.system_supplier || '',
      data.wetbench_info || '',
      data.actuator_info || '',
      data.hardware || '',
      data.software || '',
      data.model_version || '',
      data.ticket_notes || '',
      data.overview_id
    );
    
    // Get the updated record
    const updatedOverview = db.prepare(`
      SELECT o.*, t.hil_name
      FROM test_bench_project_overview o
      LEFT JOIN test_benches t ON o.bench_id = t.bench_id
      WHERE o.overview_id = ?
    `).get(data.overview_id);
    
    // Close the database connection
    db.close();
    
    return NextResponse.json({ 
      message: 'Project overview updated successfully',
      projectOverview: updatedOverview
    });
    
  } catch (error) {
    console.error('Error updating project overview:', error);
    return NextResponse.json(
      { error: 'Failed to update project overview' },
      { status: 500 }
    );
  }
} 