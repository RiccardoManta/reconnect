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

// Interface for POST/PUT request body
interface AssignmentBody {
    pc_id?: number | null;
    vm_id?: number | null;
}

// Helper to check if at least one target is provided
function isValidTarget(body: AssignmentBody): boolean {
    return (body.pc_id !== undefined && body.pc_id !== null) || 
           (body.vm_id !== undefined && body.vm_id !== null);
}

// Helper to check if BOTH targets are provided (which is invalid)
function isAmbiguousTarget(body: AssignmentBody): boolean {
    return (body.pc_id !== undefined && body.pc_id !== null) && 
           (body.vm_id !== undefined && body.vm_id !== null);
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

// POST: Create or Update an assignment
export async function POST(
    request: NextRequest,
    context: any 
): Promise<NextResponse> {
    try {
        const licenseIdStr = (context?.params?.license_id as string) || ''; 
        const licenseId = parseInt(licenseIdStr, 10);
        if (isNaN(licenseId)) {
            return NextResponse.json({ error: 'Invalid License ID' }, { status: 400 });
        }

        const body: AssignmentBody = await request.json();
        const hasPcId = body.pc_id !== null && body.pc_id !== undefined;
        const hasVmId = body.vm_id !== null && body.vm_id !== undefined;

        if ((!hasPcId && !hasVmId) || (hasPcId && hasVmId)) {
            return NextResponse.json({ error: 'Assignment must have either a pc_id OR a vm_id, but not both.' }, { status: 400 });
        }

        const newPcId = hasPcId ? Number(body.pc_id) : null;
        const newVmId = hasVmId ? Number(body.vm_id) : null;

        if ((hasPcId && isNaN(newPcId!)) || (hasVmId && isNaN(newVmId!))) {
             return NextResponse.json({ error: 'Invalid pc_id or vm_id provided.' }, { status: 400 });
        }

        const assignedOn = new Date().toISOString().slice(0, 10);

        // --- Transaction: Check existing, then UPDATE or INSERT --- 
        await dbUtils.transaction(async (connection) => {
            const [existingAssignments] = await connection.query<LicenseAssignment[]>(
                `SELECT assignment_id, pc_id, vm_id FROM license_assignments WHERE license_id = ?`,
                [licenseId]
            );

            if (existingAssignments.length > 0) {
                // Assignment exists, UPDATE it
                const existingAssignment = existingAssignments[0];
                
                console.log(`[API POST /licenses/${licenseId}/assignment] (TX) Attempting to update assignment.`);
                console.log(`[API POST /licenses/${licenseId}/assignment] (TX) Existing: pc_id=${existingAssignment.pc_id}, vm_id=${existingAssignment.vm_id}`);
                console.log(`[API POST /licenses/${licenseId}/assignment] (TX) New: pc_id=${newPcId}, vm_id=${newVmId}`);

                // Check if it's actually a change to avoid unnecessary update & trigger fire
                if (existingAssignment.pc_id === newPcId && existingAssignment.vm_id === newVmId) {
                    console.log(`[API POST /licenses/${licenseId}/assignment] (TX) Assignment target is the same. Update will refresh 'assigned_on'.`);
                }
                
                const updateQuery = `
                    UPDATE license_assignments 
                    SET pc_id = ?, vm_id = ?, assigned_on = ?
                    WHERE license_id = ?
                `;
                const updateValues = [newPcId, newVmId, assignedOn, licenseId];
                const [updateResult] = await connection.query<ResultSetHeader>(updateQuery, updateValues);

                if (updateResult.affectedRows === 0 && !(existingAssignment.pc_id === newPcId && existingAssignment.vm_id === newVmId)) {
                    // This case should ideally not happen if the record existed unless it was deleted concurrently
                    // or if the values were actually the same and DB optimized it (though pc_id/vm_id check above should catch it)
                    console.warn(`[API POST /licenses/${licenseId}/assignment] (TX WARN) Update affected 0 rows but changes were expected.`);
                    // Potentially throw an error if this is critical, or just log.
                }
                 console.log(`[API POST /licenses/${licenseId}/assignment] (TX) Updated assignment. Affected: ${updateResult.affectedRows}`);

            } else {
                // No existing assignment, INSERT new one
                const insertQuery = `
                    INSERT INTO license_assignments (license_id, pc_id, vm_id, assigned_on)
                    VALUES (?, ?, ?, ?)
                `;
                const insertValues = [licenseId, newPcId, newVmId, assignedOn];
                const [insertResult] = await connection.query<ResultSetHeader>(insertQuery, insertValues);

                if (!insertResult.insertId) {
                    console.error(`[API POST /licenses/${licenseId}/assignment] (TX) Insert returned falsy insertId.`);
                    throw new Error('Failed to get insertId for new assignment within transaction.');
                }
                 console.log(`[API POST /licenses/${licenseId}/assignment] (TX) Inserted new assignment. ID: ${insertResult.insertId}`);
            }
        });
        // --- Transaction End --- 

        const newOrUpdatedAssignment = await getCurrentAssignment(licenseId);

        return NextResponse.json({ 
            success: true, 
            message: 'License assigned successfully',
            assignment: newOrUpdatedAssignment // Return the state after operation
        }, { status: 200 }); // 200 OK is generally better for idempotency if it can be an update

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
    // Apply workaround: Use context: any
    context: any 
): Promise<NextResponse> {
    try {
        // Access licenseId via context using optional chaining and casting
        const licenseIdStr = (context?.params?.license_id as string) || '';
        const licenseId = parseInt(licenseIdStr, 10);
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