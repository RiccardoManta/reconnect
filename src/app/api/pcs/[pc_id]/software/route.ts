import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// Interface for data returned by GET
interface PcSoftwareLink extends RowDataPacket {
    pc_id: number;
    software_id: number;
    install_date: string | null; // Assuming DATE is string
    // Optionally join with software table to get names directly
    // software_name?: string;
    // major_version?: string | null;
    // vendor?: string | null;
}

// Interface for POST request body
interface AssignSoftwareBody {
    software_id: number;
    install_date?: string | null; // Optional install date
}

// GET assigned software for a specific PC
export async function GET(
    request: NextRequest,
    // Using 'any' because the specific type { params: { ... } } 
    // caused persistent build errors in the Docker environment (Next.js 15.3.0).
    context: any 
): Promise<NextResponse> {
    try {
        const pcId = parseInt(context.params.pc_id, 10);
        if (isNaN(pcId)) {
            return NextResponse.json({ error: 'Invalid PC ID' }, { status: 400 });
        }

        // Query pc_software, potentially joining software for more info
        const assignedSoftware = await dbUtils.query<PcSoftwareLink[]>(
            `SELECT ps.pc_id, ps.software_id, ps.install_date 
             FROM pc_software ps 
             WHERE ps.pc_id = ? 
             ORDER BY ps.software_id`, // Or join and order by name
            [pcId]
        );

        return NextResponse.json({ softwareAssignments: assignedSoftware });

    } catch (error: unknown) {
        console.error('Error fetching assigned software:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to fetch assigned software', details: message },
            { status: 500 }
        );
    }
}

// POST: Assign software to a PC
export async function POST(
    request: NextRequest,
    // Using 'any' because the specific type { params: { ... } } 
    // caused persistent build errors in the Docker environment (Next.js 15.3.0).
    context: any 
): Promise<NextResponse> {
    try {
        const pcId = parseInt(context.params.pc_id, 10);
        if (isNaN(pcId)) {
            return NextResponse.json({ error: 'Invalid PC ID' }, { status: 400 });
        }

        const body: AssignSoftwareBody = await request.json();

        if (!body.software_id || typeof body.software_id !== 'number') {
             return NextResponse.json({ error: 'Valid Software ID (software_id) is required' }, { status: 400 });
        }

        const insertQuery = `
            INSERT INTO pc_software (pc_id, software_id, install_date)
            VALUES (?, ?, ?)
        `;
        const insertValues = [
            pcId,
            body.software_id,
            body.install_date || null // Handle optional date
        ];

        // Using insert might just return the ID of the link table row, which isn't very useful.
        // Using update (which handles INSERT/UPDATE/DELETE) might be better if it returns affectedRows.
        // Let's use update to check if it worked.
        const affectedRows = await dbUtils.update(insertQuery, insertValues);

        if (affectedRows === 0) {
            // This might happen if the insert failed silently, or if dbUtils.update doesn't work for INSERT.
            // Consider adding more robust checking or using a different dbUtils method if available.
            throw new Error("Assignment may not have been created."); 
        }

        // Optionally: Query the created assignment for confirmation
        const newAssignment = await dbUtils.queryOne<PcSoftwareLink>(
            `SELECT * FROM pc_software WHERE pc_id = ? AND software_id = ?`,
            [pcId, body.software_id]
        );

        return NextResponse.json({ 
            success: true, 
            message: 'Software assigned successfully',
            assignment: newAssignment // Return the created link record
        }, { status: 201 });

    } catch (error: unknown) {
        console.error('Error assigning software:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        // Handle specific errors like duplicate entry or foreign key violations
        if (message.includes('Duplicate entry')) {
            return NextResponse.json({ error: 'Software is already assigned to this PC.', details: message }, { status: 409 }); // Conflict
        }
        if (message.includes('foreign key constraint fails')) {
            return NextResponse.json({ error: 'Invalid PC ID or Software ID.', details: message }, { status: 400 });
        }
        return NextResponse.json(
            { error: 'Failed to assign software', details: message },
            { status: 500 }
        );
    }
} 