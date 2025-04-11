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