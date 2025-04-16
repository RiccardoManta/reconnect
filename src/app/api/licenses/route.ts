import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// Interface for License data returned by API
interface License extends RowDataPacket {
    license_id: number;
    tool_name: string;
    license_number: string | null;
    maintenance_end: string | null; // Assuming date is stored as string e.g., 'YYYY-MM-DD'
    owner: string | null;
    assigned_pc_id: number | null;
}

// Interface for POST/PUT request body
interface LicenseRequestBody {
    license_id?: number; // Only for PUT
    tool_name: string;
    license_number?: string;
    maintenance_end?: string;
    owner?: string;
    assigned_pc_id?: number;
}

// GET method to fetch all licenses
export async function GET(): Promise<NextResponse> {
  try {
    const licenses = await dbUtils.query<License[]>(
      `SELECT * FROM licenses ORDER BY license_id`
    );
    
    return NextResponse.json({ licenses });

  } catch (error: unknown) {
    console.error('Error fetching licenses:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch licenses', details: message },
      { status: 500 }
    );
  }
}

// POST method to add a new license
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: LicenseRequestBody = await request.json();
    
    // Validate required fields
    if (!body.tool_name) {
      return NextResponse.json(
        { error: 'Tool Name (tool_name) is required' },
        { status: 400 }
      );
    }

    // Insert the new license record using dbUtils.insert
    const licenseId = await dbUtils.insert(
      `INSERT INTO licenses (tool_name, license_number, maintenance_end, owner, assigned_pc_id) 
       VALUES (?, ?, ?, ?, ?)`, 
      [
        body.tool_name,
        body.license_number || null,
        body.maintenance_end || null, // Ensure date format matches DB
        body.owner || null,
        body.assigned_pc_id || null
      ]
    );

    if (!licenseId) {
        throw new Error("Failed to get license_id after insert.");
    }

    // Get the newly inserted record
    const newLicense = await dbUtils.queryOne<License>(
      `SELECT * FROM licenses WHERE license_id = ?`,
      [licenseId]
    );
        
    return NextResponse.json({ 
      success: true, 
      message: 'License added successfully',
      license: newLicense
    }, { status: 201 });
    
  } catch (error: unknown) {
    console.error('Error adding license:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    // Specific check for foreign key constraints if needed
    if (message.includes('foreign key constraint fails')) {
      return NextResponse.json(
        { error: 'Failed to add license: Invalid assigned_pc_id. The PC does not exist.', details: message },
        { status: 400 } // Bad request due to invalid foreign key
      );
    }
    return NextResponse.json(
      { error: 'Failed to add license', details: message },
      { status: 500 }
    );
  }
}

// PUT method to update an existing license
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body: LicenseRequestBody = await request.json();
    
    // Validate required fields for PUT
    if (!body.license_id) {
      return NextResponse.json(
        { error: 'License ID (license_id) is required for update' },
        { status: 400 }
      );
    }
    if (!body.tool_name) {
      return NextResponse.json(
        { error: 'Tool Name (tool_name) is required' },
        { status: 400 }
      );
    }

    // Update the license record using dbUtils.update
    const affectedRows = await dbUtils.update(
      `UPDATE licenses SET
         tool_name = ?, 
         license_number = ?, 
         maintenance_end = ?, 
         owner = ?,
         assigned_pc_id = ?
       WHERE license_id = ?`, 
      [
        body.tool_name,
        body.license_number || null,
        body.maintenance_end || null, // Ensure date format matches DB
        body.owner || null,
        body.assigned_pc_id || null,
        body.license_id
      ]
    );
    
    if (affectedRows === 0) {
      return NextResponse.json(
        { error: 'License record not found or no changes made' },
        { status: 404 }
      );
    }

    // Get the updated record
    const updatedLicense = await dbUtils.queryOne<License>(
        `SELECT * FROM licenses WHERE license_id = ?`,
        [body.license_id]
    );
        
    return NextResponse.json({ 
      success: true, 
      message: 'License updated successfully',
      license: updatedLicense
    });
    
  } catch (error: unknown) {
    console.error('Error updating license:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    // Specific check for foreign key constraints if needed
    if (message.includes('foreign key constraint fails')) {
      return NextResponse.json(
        { error: 'Failed to update license: Invalid assigned_pc_id. The PC does not exist.', details: message },
        { status: 400 } // Bad request due to invalid foreign key
      );
    }
    return NextResponse.json(
      { error: 'Failed to update license', details: message },
      { status: 500 }
    );
  }
} 