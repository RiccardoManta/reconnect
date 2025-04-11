import { NextResponse } from 'next/server';
const Database = require('better-sqlite3');
const path = require('path');

// GET method to fetch all licenses
export async function GET() {
  try {
    // Use absolute path for Next.js
    const dbPath = path.resolve(process.cwd(), 'src/db/reconnect.db');
    const db = new Database(dbPath);
    
    // Get all licenses
    const licenses = db.prepare('SELECT * FROM licenses ORDER BY license_id').all();
    
    // Close the database connection
    db.close();
    
    return NextResponse.json({ licenses });
  } catch (error) {
    console.error('Error fetching licenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch licenses' },
      { status: 500 }
    );
  }
} 