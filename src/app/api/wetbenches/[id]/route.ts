import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket } from 'mysql2/promise';

// Interface for Wetbench data (same as in parent route)
interface Wetbench extends RowDataPacket {
    wetbench_id: number;
    wetbench_name: string;
    pp_number: string | null;
    owner: string | null;
    system_type: string | null;
    platform: string | null;
    system_supplier: string | null;
    linked_bench_id: number | null;
    actuator_info: string | null;
    hardware_components: string | null;
    inventory_number: string | null;
}

// GET method to fetch a single wetbench by ID
export async function GET(request: NextRequest, context: any): Promise<NextResponse> {
    // Assuming context structure { params: { id: string } }
    const id = context?.params?.id;
    if (typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid or missing wetbench ID in params' }, { status: 400 });
    }
    const wetbenchId = parseInt(id, 10);

    if (isNaN(wetbenchId)) {
        return NextResponse.json({ error: 'Invalid wetbench ID format' }, { status: 400 });
    }

    try {
        const wetbench = await dbUtils.queryOne<Wetbench>(
            `SELECT * FROM wetbenches WHERE wetbench_id = ?`,
            [wetbenchId]
        );

        if (!wetbench) {
            return NextResponse.json({ error: 'Wetbench not found' }, { status: 404 });
        }

        return NextResponse.json({ wetbench });

    } catch (error: unknown) {
        console.error(`Error fetching wetbench ${wetbenchId}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to fetch wetbench', details: message },
            { status: 500 }
        );
    }
}

// DELETE method to remove a wetbench by ID
export async function DELETE(request: NextRequest, context: any): Promise<NextResponse> {
    // Assuming context structure { params: { id: string } }
    const id = context?.params?.id;
    if (typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid or missing wetbench ID in params' }, { status: 400 });
    }
    const wetbenchId = parseInt(id, 10);

    if (isNaN(wetbenchId)) {
        return NextResponse.json({ error: 'Invalid wetbench ID format' }, { status: 400 });
    }

    try {
        // Use dbUtils.update for DELETE as it returns affectedRows
        const affectedRows = await dbUtils.update(
            `DELETE FROM wetbenches WHERE wetbench_id = ?`,
            [wetbenchId]
        );

        if (affectedRows === 0) {
            return NextResponse.json({ error: 'Wetbench not found or already deleted' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: `Wetbench with ID ${wetbenchId} deleted successfully.` });

    } catch (error: unknown) {
        console.error(`Error deleting wetbench ${wetbenchId}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        // Add foreign key constraint check if wetbenches are referenced elsewhere
        if (message.includes('foreign key constraint fails')) {
             return NextResponse.json(
                 { error: `Failed to delete wetbench: It is still referenced by other records. Please update or remove associated records first.`, details: message },
                 { status: 400 } // Bad request due to constraint violation
             );
         }
        return NextResponse.json(
            { error: 'Failed to delete wetbench', details: message },
            { status: 500 }
        );
    }
} 