import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// Interface adjusted for the NEW schema (snake_case)
interface LicenseFromDb extends RowDataPacket {
    license_id: number;
    software_id: number; // Changed from tool_name
    license_name: string | null;
    license_description: string | null;
    license_number: string | null;
    dongle_number: string | null;
    activation_key: string | null;
    system_id: string | null;
    license_user: string | null;
    maintenance_end: string | null; // Keep as string for Date handling
    owner: string | null;
    license_type: string | null;
    remarks: string | null;
    // removed assigned_pc_id
}

// Interface for POST/PUT request body (snake_case)
interface LicenseRequestBody {
    license_id?: number; // Only for PUT
    software_id: number; // Changed from tool_name, required
    license_name?: string | null;
    license_description?: string | null;
    license_number?: string | null;
    dongle_number?: string | null;
    activation_key?: string | null;
    system_id?: string | null;
    license_user?: string | null;
    maintenance_end?: string | null;
    owner?: string | null;
    license_type?: string | null;
    remarks?: string | null;
}

// GET method to fetch all licenses
export async function GET(): Promise<NextResponse> {
  try {
    // Explicitly selecting columns based on the new schema is safer
    // but SELECT * works if the dbUtils typing is generic enough.
    const licenses = await dbUtils.query<LicenseFromDb[]>(
      `SELECT 
         license_id, software_id, license_name, license_description, 
         license_number, dongle_number, activation_key, system_id, 
         license_user, maintenance_end, owner, license_type, remarks 
       FROM licenses ORDER BY license_id`
    );
    
    // The frontend expects { licenses: [...] }
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
    if (!body.software_id) {
      return NextResponse.json(
        { error: 'Software ID (software_id) is required' }, 
        { status: 400 }
      );
    }

    // Insert the new license record using dbUtils.insert
    const insertQuery = `
      INSERT INTO licenses (
          software_id, license_name, license_description, license_number, 
          dongle_number, activation_key, system_id, license_user, 
          maintenance_end, owner, license_type, remarks
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const insertValues = [
      body.software_id,
      body.license_name || null,
      body.license_description || null,
      body.license_number || null,
      body.dongle_number || null,
      body.activation_key || null,
      body.system_id || null,
      body.license_user || null,
      body.maintenance_end || null, 
      body.owner || null,
      body.license_type || null,
      body.remarks || null
    ];

    const licenseId = await dbUtils.insert(insertQuery, insertValues);

    if (!licenseId) {
        throw new Error("Failed to get license_id after insert.");
    }

    // Get the newly inserted record
    const newLicense = await dbUtils.queryOne<LicenseFromDb>(
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
    if (message.includes('foreign key constraint fails')) {
      return NextResponse.json(
        { error: 'Failed to add license: Invalid software_id. The software does not exist.', details: message },
        { status: 400 }
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
    if (!body.software_id) {
      return NextResponse.json(
        { error: 'Software ID (software_id) is required' }, 
        { status: 400 }
      );
    }

    // Update the license record using dbUtils.update
    const updateQuery = `
      UPDATE licenses SET
         software_id = ?, 
         license_name = ?, 
         license_description = ?, 
         license_number = ?, 
         dongle_number = ?, 
         activation_key = ?, 
         system_id = ?, 
         license_user = ?, 
         maintenance_end = ?, 
         owner = ?, 
         license_type = ?, 
         remarks = ?
       WHERE license_id = ?
    `; 
    const updateValues = [
        body.software_id,
        body.license_name || null,
        body.license_description || null,
        body.license_number || null,
        body.dongle_number || null,
        body.activation_key || null,
        body.system_id || null,
        body.license_user || null,
        body.maintenance_end || null, 
        body.owner || null,
        body.license_type || null,
        body.remarks || null,
        body.license_id
    ];

    const affectedRows = await dbUtils.update(updateQuery, updateValues);
    
    if (affectedRows === 0) {
      return NextResponse.json(
        { error: 'License record not found or no changes made' },
        { status: 404 }
      );
    }

    // Get the updated record
    const updatedLicense = await dbUtils.queryOne<LicenseFromDb>(
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
    if (message.includes('foreign key constraint fails')) {
      return NextResponse.json(
        { error: 'Failed to update license: Invalid software_id. The software does not exist.', details: message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update license', details: message },
      { status: 500 }
    );
  }
} 