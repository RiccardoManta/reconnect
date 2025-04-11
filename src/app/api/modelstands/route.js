import { NextResponse } from 'next/server';
const Database = require('better-sqlite3');
const path = require('path');

// GET method to fetch all model stands
export async function GET() {
  try {
    // Use absolute path for Next.js
    const dbPath = path.resolve(process.cwd(), 'src/db/reconnect.db');
    const db = new Database(dbPath);
    
    // Get all model stands
    const modelStands = db.prepare('SELECT * FROM model_stands ORDER BY model_id').all();
    
    // Close the database connection
    db.close();
    
    return NextResponse.json({ modelStands });
  } catch (error) {
    console.error('Error fetching model stands:', error);
    return NextResponse.json(
      { error: 'Failed to fetch model stands' },
      { status: 500 }
    );
  }
} 