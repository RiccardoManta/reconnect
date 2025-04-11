import { NextResponse } from 'next/server';
const Database = require('better-sqlite3');
const path = require('path');

// GET method to fetch all hardware installation data
export async function GET() {
  try {
    // Use absolute path for Next.js
    const dbPath = path.resolve(process.cwd(), 'src/db/reconnect.db');
    const db = new Database(dbPath);
    
    // Get all hardware installation data with test bench info
    const hardware = db.prepare(`
      SELECT h.*, t.hil_name
      FROM hardware_installation h
      LEFT JOIN test_benches t ON h.bench_id = t.bench_id
      ORDER BY h.install_id
    `).all();
    
    // Close the database connection
    db.close();
    
    return NextResponse.json({ hardware });
  } catch (error) {
    console.error('Error fetching hardware installation data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hardware installation data' },
      { status: 500 }
    );
  }
} 