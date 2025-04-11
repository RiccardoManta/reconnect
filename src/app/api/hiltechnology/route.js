import { NextResponse } from 'next/server';
const Database = require('better-sqlite3');
const path = require('path');

// GET method to fetch all HIL technology data
export async function GET() {
  try {
    // Use absolute path for Next.js
    const dbPath = path.resolve(process.cwd(), 'src/db/reconnect.db');
    const db = new Database(dbPath);
    
    // Get all HIL technology data with test bench info
    const technology = db.prepare(`
      SELECT h.*, t.hil_name 
      FROM hil_technology h
      LEFT JOIN test_benches t ON h.bench_id = t.bench_id
      ORDER BY h.tech_id
    `).all();
    
    // Close the database connection
    db.close();
    
    return NextResponse.json({ technology });
  } catch (error) {
    console.error('Error fetching HIL technology data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch HIL technology data' },
      { status: 500 }
    );
  }
} 