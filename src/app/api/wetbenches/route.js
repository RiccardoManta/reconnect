import { NextResponse } from 'next/server';
const Database = require('better-sqlite3');
const path = require('path');

// GET method to fetch all wetbenches
export async function GET() {
  try {
    // Use absolute path for Next.js
    const dbPath = path.resolve(process.cwd(), 'src/db/reconnect.db');
    const db = new Database(dbPath);
    
    // Get all wetbenches
    const wetbenches = db.prepare('SELECT * FROM wetbenches ORDER BY wetbench_id').all();
    
    // Close the database connection
    db.close();
    
    return NextResponse.json({ wetbenches });
  } catch (error) {
    console.error('Error fetching wetbenches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wetbenches' },
      { status: 500 }
    );
  }
} 