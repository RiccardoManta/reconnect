import { NextResponse } from 'next/server';
const Database = require('better-sqlite3');
const path = require('path');

// GET method to fetch all PC overview data
export async function GET() {
  try {
    // Use absolute path for Next.js
    const dbPath = path.resolve(process.cwd(), 'src/db/reconnect.db');
    const db = new Database(dbPath);
    
    // Get all PC overview data with test bench info
    const pcs = db.prepare(`
      SELECT p.*, t.hil_name
      FROM pc_overview p
      LEFT JOIN test_benches t ON p.bench_id = t.bench_id
      ORDER BY p.pc_id
    `).all();
    
    // Close the database connection
    db.close();
    
    return NextResponse.json({ pcs });
  } catch (error) {
    console.error('Error fetching PC overview data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PC overview data' },
      { status: 500 }
    );
  }
} 