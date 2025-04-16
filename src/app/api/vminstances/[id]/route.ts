import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket } from 'mysql2/promise';

// Interface for VM Instance data (same as in parent route)
interface VmInstance extends RowDataPacket {
    vm_id: number;
    vm_name: string;
    vm_address: string | null;
    installed_tools: string | null;
}

// GET method to fetch a single VM instance by ID
export async function GET(request: NextRequest, context: any): Promise<NextResponse> {
    // Assuming context structure { params: { id: string } }
    const id = context?.params?.id;
    if (typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid or missing VM ID in params' }, { status: 400 });
    }
    const vmId = parseInt(id, 10);

    if (isNaN(vmId)) {
        return NextResponse.json({ error: 'Invalid VM ID format' }, { status: 400 });
    }

    try {
        const vmInstance = await dbUtils.queryOne<VmInstance>(
            `SELECT * FROM vm_instances WHERE vm_id = ?`,
            [vmId]
        );

        if (!vmInstance) {
            return NextResponse.json({ error: 'VM instance not found' }, { status: 404 });
        }

        return NextResponse.json({ vmInstance });

    } catch (error: unknown) {
        console.error(`Error fetching VM instance ${vmId}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to fetch VM instance', details: message },
            { status: 500 }
        );
    }
}

// DELETE method to remove a VM instance by ID
export async function DELETE(request: NextRequest, context: any): Promise<NextResponse> {
    // Assuming context structure { params: { id: string } }
    const id = context?.params?.id;
    if (typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid or missing VM ID in params' }, { status: 400 });
    }
    const vmId = parseInt(id, 10);

    if (isNaN(vmId)) {
        return NextResponse.json({ error: 'Invalid VM ID format' }, { status: 400 });
    }

    try {
        // Use dbUtils.update for DELETE as it returns affectedRows
        const affectedRows = await dbUtils.update(
            `DELETE FROM vm_instances WHERE vm_id = ?`,
            [vmId]
        );

        if (affectedRows === 0) {
            return NextResponse.json({ error: 'VM instance not found or already deleted' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: `VM instance with ID ${vmId} deleted successfully.` });

    } catch (error: unknown) {
        console.error(`Error deleting VM instance ${vmId}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        // Add foreign key constraint check if vm_instances are referenced elsewhere
        if (message.includes('foreign key constraint fails')) {
             return NextResponse.json(
                 { error: `Failed to delete VM instance: It is still referenced by other records. Please update or remove associated records first.`, details: message },
                 { status: 400 } // Bad request due to constraint violation
             );
         }
        return NextResponse.json(
            { error: 'Failed to delete VM instance', details: message },
            { status: 500 }
        );
    }
} 