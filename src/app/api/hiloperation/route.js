import { NextResponse } from 'next/server';
const Database = require('better-sqlite3');
const path = require('path');

// GET method to fetch all HIL operation data
export async function GET() {
  try {
    // Use absolute path for Next.js
    const dbPath = path.resolve(process.cwd(), 'src/db/reconnect.db');
    const db = new Database(dbPath);
    
    // Get all HIL operation data with test bench info
    const operation = db.prepare(`
      SELECT o.*, t.hil_name
      FROM hil_operation o
      LEFT JOIN test_benches t ON o.bench_id = t.bench_id
      ORDER BY o.operation_id
    `).all();
    
    // Close the database connection
    db.close();
    
    return NextResponse.json({ operation });
  } catch (error) {
    console.error('Error fetching HIL operation data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch HIL operation data' },
      { status: 500 }
    );
  }
} 