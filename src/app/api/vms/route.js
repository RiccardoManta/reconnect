import { NextResponse } from 'next/server';
const Database = require('better-sqlite3');
const path = require('path');

// GET method to fetch all VM instances
export async function GET() {
  try {
    // Use absolute path for Next.js
    const dbPath = path.resolve(process.cwd(), 'src/db/reconnect.db');
    const db = new Database(dbPath);
    
    // Get all VM instances
    const vms = db.prepare('SELECT * FROM vm_instances ORDER BY vm_id').all();
    
    // Close the database connection
    db.close();
    
    return NextResponse.json({ vms });
  } catch (error) {
    console.error('Error fetching VM instances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch VM instances' },
      { status: 500 }
    );
  }
} 