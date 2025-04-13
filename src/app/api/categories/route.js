import { NextResponse } from 'next/server';
const Database = require('better-sqlite3');
const path = require('path');

// GET method to fetch all unique platforms as categories
export async function GET() {
  try {
    // Use absolute path for Next.js
    const dbPath = path.resolve(process.cwd(), 'src/db/reconnect.db');
    const db = new Database(dbPath);
    
    // Get unique platforms from the test_bench_project_overview table
    const categories = db.prepare(`
      SELECT DISTINCT platform
      FROM test_bench_project_overview
      WHERE platform IS NOT NULL AND platform != ''
      ORDER BY platform
    `).all();
    
    // Close the database connection
    db.close();
    
    // Extract just the platform values to return as a simple array
    const categoryList = categories.map(cat => cat.platform);
    
    return NextResponse.json({ categories: categoryList });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
} 