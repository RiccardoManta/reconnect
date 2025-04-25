import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket } from 'mysql2/promise';

// Interface for Software data from the database
interface SoftwareFromDb extends RowDataPacket {
    software_id: number;
    software_name: string;
    major_version: string | null;
    vendor: string | null;
}

// Interface for POST/PUT request body (snake_case)
interface SoftwareRequestBody {
    software_id?: number; // Only for PUT
    software_name: string; // Required
    major_version?: string | null;
    vendor?: string | null;
}

// GET method to fetch all software
export async function GET(): Promise<NextResponse> {
  try {
    const software = await dbUtils.query<SoftwareFromDb[]>(
      `SELECT software_id, software_name, major_version, vendor 
       FROM software 
       ORDER BY software_name, major_version` // Order for consistent dropdowns
    );
    
    // Frontend expects { software: [...] }
    return NextResponse.json({ software });

  } catch (error: unknown) {
    console.error('Error fetching software:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch software', details: message },
      { status: 500 }
    );
  }
}

// POST method to add a new software entry
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: SoftwareRequestBody = await request.json();

    // Validate required fields
    if (!body.software_name) {
      return NextResponse.json(
        { error: 'Software Name (software_name) is required' },
        { status: 400 }
      );
    }

    // Insert the new software record using dbUtils.insert
    const insertQuery = `
      INSERT INTO software (software_name, major_version, vendor)
      VALUES (?, ?, ?)
    `;
    const insertValues = [
      body.software_name,
      body.major_version || null,
      body.vendor || null
    ];

    const softwareId = await dbUtils.insert(insertQuery, insertValues);

    if (!softwareId) {
        throw new Error("Failed to get software_id after insert.");
    }

    // Get the newly inserted record
    const newSoftware = await dbUtils.queryOne<SoftwareFromDb>(
      `SELECT * FROM software WHERE software_id = ?`,
      [softwareId]
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Software added successfully',
      software: newSoftware
    }, { status: 201 });

  } catch (error: unknown) {
    console.error('Error adding software:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    // Handle potential unique constraint errors if software_name should be unique
    // if (message.includes('UNIQUE constraint failed')) { ... }
    return NextResponse.json(
      { error: 'Failed to add software', details: message },
      { status: 500 }
    );
  }
}

// PUT method to update an existing software entry
/* 
export async function PUT(request: NextRequest): Promise<NextResponse> {
  // This logic is now handled by src/app/api/software/[id]/route.ts
  return NextResponse.json({ message: 'PUT method moved to /[id] route.' }, { status: 405 }); // 405 Method Not Allowed
}
*/
// Commenting out or removing the PUT handler entirely 