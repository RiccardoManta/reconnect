import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// Interface for data returned by GET
interface VmSoftwareLink extends RowDataPacket {
    vm_id: number;
    software_id: number;
    install_date: string | null; // Assuming DATE is string
    // Optionally join with software table to get names directly
}

// Interface for POST request body
interface AssignSoftwareBody {
    software_id: number;
    install_date?: string | null; // Optional install date
}

// GET assigned software for a specific VM
export async function GET(
    request: NextRequest,
    context: any
): Promise<NextResponse> {
    try {
        const vmIdStr = (context?.params?.vm_id as string) || '';
        const vmId = parseInt(vmIdStr, 10);
        if (isNaN(vmId)) {
            return NextResponse.json({ error: 'Invalid VM ID' }, { status: 400 });
        }

        // Query vm_software
        const assignedSoftware = await dbUtils.query<VmSoftwareLink[]>(
            `SELECT vs.vm_id, vs.software_id, vs.install_date 
             FROM vm_software vs 
             WHERE vs.vm_id = ? 
             ORDER BY vs.software_id`,
            [vmId]
        );

        return NextResponse.json({ softwareAssignments: assignedSoftware });

    } catch (error: unknown) {
        console.error('Error fetching assigned VM software:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to fetch assigned VM software', details: message },
            { status: 500 }
        );
    }
}

// POST: Assign software to a VM
export async function POST(
    request: NextRequest,
    context: any
): Promise<NextResponse> {
    try {
        const vmIdStr = (context?.params?.vm_id as string) || '';
        const vmId = parseInt(vmIdStr, 10);
        if (isNaN(vmId)) {
            return NextResponse.json({ error: 'Invalid VM ID' }, { status: 400 });
        }

        const body: AssignSoftwareBody = await request.json();

        if (!body.software_id || typeof body.software_id !== 'number') {
             return NextResponse.json({ error: 'Valid Software ID (software_id) is required' }, { status: 400 });
        }

        const insertQuery = `
            INSERT INTO vm_software (vm_id, software_id, install_date)
            VALUES (?, ?, ?)
        `;
        const insertValues = [
            vmId,
            body.software_id,
            body.install_date || null
        ];

        // Use dbUtils.update as it returns affectedRows
        const affectedRows = await dbUtils.update(insertQuery, insertValues);

        if (affectedRows === 0) {
            throw new Error("VM Software Assignment may not have been created."); 
        }

        // Optionally: Query the created assignment for confirmation
        const newAssignment = await dbUtils.queryOne<VmSoftwareLink>(
            `SELECT * FROM vm_software WHERE vm_id = ? AND software_id = ?`,
            [vmId, body.software_id]
        );

        return NextResponse.json({ 
            success: true, 
            message: 'Software assigned to VM successfully',
            assignment: newAssignment
        }, { status: 201 });

    } catch (error: unknown) {
        console.error('Error assigning software to VM:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        if (message.includes('Duplicate entry')) {
            return NextResponse.json({ error: 'Software is already assigned to this VM.', details: message }, { status: 409 });
        }
        if (message.includes('foreign key constraint fails')) {
            return NextResponse.json({ error: 'Invalid VM ID or Software ID.', details: message }, { status: 400 });
        }
        return NextResponse.json(
            { error: 'Failed to assign software to VM', details: message },
            { status: 500 }
        );
    }
} 