import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// Interface for the assignment data
interface LicenseAssignment extends RowDataPacket {
    assignment_id: number;
    license_id: number;
    pc_id: number | null;
    vm_id: number | null;
    assigned_on: string | null; // Assuming DATE is string
}

// Interface for POST request body
interface AssignLicenseBody {
    pc_id?: number | null; 
    vm_id?: number | null;
    assigned_on?: string | null; // Optional assign date
}

// Helper to get the current assignment for a license
async function getCurrentAssignment(licenseId: number): Promise<LicenseAssignment | null> {
    return await dbUtils.queryOne<LicenseAssignment>(
        `SELECT * FROM license_assignments WHERE license_id = ? LIMIT 1`,
        [licenseId]
    );
}

// GET the current assignment for a specific license
export async function GET(
    request: NextRequest,
    // Using 'any' due to persistent build errors with specific context type
    context: any 
): Promise<NextResponse> {
    try {
        const licenseId = parseInt(context.params.license_id, 10);
        if (isNaN(licenseId)) {
            return NextResponse.json({ error: 'Invalid License ID' }, { status: 400 });
        }

        const assignment = await getCurrentAssignment(licenseId);

        if (!assignment) {
             return NextResponse.json({ assignment: null }, { status: 200 }); // No assignment found is valid
        }

        return NextResponse.json({ assignment });

    } catch (error: unknown) {
        console.error('Error fetching license assignment:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to fetch license assignment', details: message },
            { status: 500 }
        );
    }
}

// POST: Create or replace the assignment for a license
export async function POST(
    request: NextRequest,
    // Using 'any' due to persistent build errors with specific context type
    context: any 
): Promise<NextResponse> {
    try {
        const licenseId = parseInt(context.params.license_id, 10);
        if (isNaN(licenseId)) {
            return NextResponse.json({ error: 'Invalid License ID' }, { status: 400 });
        }

        const body: AssignLicenseBody = await request.json();

        // Validate: Must have pc_id OR vm_id, but not both
        const hasPcId = body.pc_id !== null && body.pc_id !== undefined;
        const hasVmId = body.vm_id !== null && body.vm_id !== undefined;

        if ((!hasPcId && !hasVmId) || (hasPcId && hasVmId)) {
            return NextResponse.json({ error: 'Assignment must have either a pc_id OR a vm_id, but not both.' }, { status: 400 });
        }

        // Ensure IDs are numbers if provided
        const pcId = hasPcId ? Number(body.pc_id) : null;
        const vmId = hasVmId ? Number(body.vm_id) : null;
        if ((hasPcId && isNaN(pcId!)) || (hasVmId && isNaN(vmId!))) {
             return NextResponse.json({ error: 'Invalid pc_id or vm_id provided.' }, { status: 400 });
        }

        const assignedOn = body.assigned_on || new Date().toISOString().slice(0, 10);

        // --- Execute DELETE and INSERT within an explicit transaction --- 
        const assignmentId = await dbUtils.transaction<number | bigint>(async (connection) => {
            // Use connection.query directly within the transaction
            await connection.query(`DELETE FROM license_assignments WHERE license_id = ?`, [licenseId]);

            const insertQuery = `
                INSERT INTO license_assignments (license_id, pc_id, vm_id, assigned_on)
                VALUES (?, ?, ?, ?)
            `;
            const insertValues = [licenseId, pcId, vmId, assignedOn];

            const [insertResult] = await connection.query<ResultSetHeader>(insertQuery, insertValues);

            if (!insertResult.insertId) {
                 console.error(`[API ERROR POST /licenses/${licenseId}/assignment] (TX) Insert returned falsy insertId.`);
                 throw new Error('Failed to get insertId within transaction.');
            }
            return insertResult.insertId;
        });
        // --- Transaction End --- 

        // Query the newly created assignment (using the standard queryOne which uses the pool)
        const newAssignment = await getCurrentAssignment(licenseId);

        return NextResponse.json({ 
            success: true, 
            message: 'License assigned successfully',
            assignment: newAssignment
        }, { status: 201 });

    } catch (error: unknown) {
        console.error('Error assigning license:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        // Handle potential FK violations if pc/vm doesn't exist
        if (message.includes('foreign key constraint fails')) {
            return NextResponse.json({ error: 'Invalid License ID, PC ID, or VM ID.', details: message }, { status: 400 });
        }
        // Handle unique constraints if the delete/insert logic fails
        if (message.includes('Duplicate entry') || message.includes('UNIQUE constraint')) {
             return NextResponse.json({ error: 'Failed to update assignment due to constraint.', details: message }, { status: 409 });
        }
        return NextResponse.json(
            { error: 'Failed to assign license', details: message },
            { status: 500 }
        );
    }
}

// DELETE: Remove the assignment for a specific license
export async function DELETE(
    request: NextRequest,
    // Using 'any' due to persistent build errors with specific context type
    context: any 
): Promise<NextResponse> {
    try {
        const licenseId = parseInt(context.params.license_id, 10);
        if (isNaN(licenseId)) {
            return NextResponse.json({ error: 'Invalid License ID' }, { status: 400 });
        }

        const affectedRows = await dbUtils.update(
            `DELETE FROM license_assignments WHERE license_id = ?`,
            [licenseId]
        );

        // It's okay if 0 rows were affected (meaning no assignment existed)
        // We could return 404 if we wanted to be strict, but 200/204 is fine.
        // if (affectedRows === 0) {
        //     return NextResponse.json({ error: 'License assignment not found' }, { status: 404 });
        // }

        return NextResponse.json({ 
            success: true, 
            message: 'License assignment removed successfully' 
        }, { status: 200 });

    } catch (error: unknown) {
        console.error('Error removing license assignment:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to remove license assignment', details: message },
            { status: 500 }
        );
    }
} 