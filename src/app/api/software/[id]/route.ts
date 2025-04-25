import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// Interface for Software data (matches the one in ../route.ts)
interface SoftwareFromDb extends RowDataPacket {
    software_id: number;
    software_name: string;
    major_version: string | null;
    vendor: string | null;
}

// Interface for PUT request body (matches the one in ../route.ts)
interface SoftwareRequestBody {
    // software_id is taken from URL params
    software_name: string; // Required
    major_version?: string | null;
    vendor?: string | null;
}

// GET method to fetch a single software entry by ID
export async function GET(
    request: NextRequest, 
    context: any // Temporarily use 'any' for build debugging
): Promise<NextResponse> {
  try {
    const id = parseInt(context.params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid Software ID' }, { status: 400 });
    }

    const software = await dbUtils.queryOne<SoftwareFromDb>(
      `SELECT * FROM software WHERE software_id = ?`,
      [id]
    );

    if (!software) {
      return NextResponse.json({ error: 'Software not found' }, { status: 404 });
    }

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

// PUT method to update an existing software entry by ID
export async function PUT(
    request: NextRequest,
    context: any // Temporarily use 'any' for build debugging
): Promise<NextResponse> {
  try {
    const id = parseInt(context.params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid Software ID' }, { status: 400 });
    }

    const body: SoftwareRequestBody = await request.json();

    // Validate required fields
    if (!body.software_name) {
      return NextResponse.json(
        { error: 'Software Name (software_name) is required' },
        { status: 400 }
      );
    }

    // Update the software record using dbUtils.update
    const updateQuery = `
      UPDATE software SET
         software_name = ?, 
         major_version = ?, 
         vendor = ?
       WHERE software_id = ?
    `;
    const updateValues = [
      body.software_name,
      body.major_version || null,
      body.vendor || null,
      id // Use ID from URL params for the WHERE clause
    ];

    const affectedRows = await dbUtils.update(updateQuery, updateValues);

    if (affectedRows === 0) {
      // Check if the record exists at all before declaring not found
      const existing = await dbUtils.queryOne<SoftwareFromDb>(
        `SELECT software_id FROM software WHERE software_id = ?`, [id]
      );
      if (!existing) {
          return NextResponse.json({ error: 'Software record not found' }, { status: 404 });
      } // If it exists but 0 rows affected, likely no change needed or concurrent update
        // For simplicity, we return success here, but could return 304 Not Modified
    }

    // Get the potentially updated record
    const updatedSoftware = await dbUtils.queryOne<SoftwareFromDb>(
        `SELECT * FROM software WHERE software_id = ?`,
        [id]
    );

    // Handle case where the item might have been deleted between update and select
    if (!updatedSoftware) {
        return NextResponse.json({ error: 'Software not found after update attempt.' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Software updated successfully',
      software: updatedSoftware
    });

  } catch (error: unknown) {
    console.error('Error updating software:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    // Handle potential unique constraint errors if software_name should be unique
    // if (message.includes('UNIQUE constraint failed')) { ... }
    return NextResponse.json(
      { error: 'Failed to update software', details: message },
      { status: 500 }
    );
  }
}

// DELETE method to remove a software entry by ID
export async function DELETE(
    request: NextRequest, 
    context: any // Temporarily use 'any' for build debugging
): Promise<NextResponse> {
  try {
    const id = parseInt(context.params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid Software ID' }, { status: 400 });
    }

    // Use dbUtils.update for DELETE, as it's designed for update/delete and returns affectedRows
    const affectedRows = await dbUtils.update(
      `DELETE FROM software WHERE software_id = ?`,
      [id]
    );

    // Check affectedRows returned directly by the update function
    if (affectedRows === 0) {
      return NextResponse.json({ error: 'Software not found' }, { status: 404 });
    }

    return NextResponse.json({ 
        success: true, 
        message: 'Software deleted successfully' 
    }, { status: 200 }); 

  } catch (error: unknown) {
    console.error('Error deleting software:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    // Handle foreign key constraint errors (e.g., if licenses still reference this software)
    if (message.includes('foreign key constraint fails')) {
        return NextResponse.json(
            { error: 'Cannot delete software: It is still referenced by licenses or other records.', details: message },
            { status: 409 } // 409 Conflict is appropriate here
        );
    }
    return NextResponse.json(
      { error: 'Failed to delete software', details: message },
      { status: 500 }
    );
  }
} 