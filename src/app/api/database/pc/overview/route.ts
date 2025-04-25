import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { PcOverview } from '../../../../../types/database';

const pool = new Pool({
  // Database connection details (ideally from environment variables)
  user: process.env.DB_USER || 'postgres', // Replace with your DB user
  host: process.env.DB_HOST || 'localhost', // Replace with your DB host
  database: process.env.DB_NAME || 'asset_management', // Replace with your DB name
  password: process.env.DB_PASSWORD || 'your_password', // Replace with your DB password
  port: parseInt(process.env.DB_PORT || '5432'),
});

export async function GET() {
  try {
    // Select only the fields defined in the PcOverview type
    // Assuming the table is named 'pc_info' and columns match the type fields
    const query = 'SELECT pc_id AS "pcId", pc_name AS "pcName", active_user AS "activeUser" FROM pc_info ORDER BY pc_id ASC;';
    const result = await pool.query(query);
    
    // Cast the result rows to the PcOverview type
    const pcs: PcOverview[] = result.rows as PcOverview[];

    return NextResponse.json(pcs);
  } catch (error) {
    console.error('Error fetching PC overview:', error);
    // Type assertion for error object
    const errorMessage = (error instanceof Error) ? error.message : 'Unknown error'; 
    return NextResponse.json({ error: 'Failed to fetch PC overview data', details: errorMessage }, { status: 500 });
  }
} 