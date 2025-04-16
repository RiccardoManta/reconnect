import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket } from 'mysql2/promise';

// Interface for PC Overview data (same as in parent route)
interface PcOverview extends RowDataPacket {
    pc_id: number;
    bench_id: number;
    pc_name: string;
    purchase_year: number | null;
    inventory_number: string | null;
    pc_role: string | null;
    pc_model: string | null;
    special_equipment: string | null;
    mac_address: string | null;
    ip_address: string | null;
    active_licenses: string | null;
    installed_tools: string | null;
    pc_info_text: string | null;
    status: string | null;
    active_user: string | null;
}

// GET method to fetch a single PC overview by ID
export async function GET(request: NextRequest, context: any): Promise<NextResponse> {
    // Assuming context structure { params: { id: string } }
    const id = context?.params?.id;
    if (typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid or missing PC ID in params' }, { status: 400 });
    }
    const pcId = parseInt(id, 10);

    if (isNaN(pcId)) {
        return NextResponse.json({ error: 'Invalid PC ID format' }, { status: 400 });
    }

    try {
        const pc = await dbUtils.queryOne<PcOverview>(
            `SELECT * FROM pc_overview WHERE pc_id = ?`,
            [pcId]
        );

        if (!pc) {
            return NextResponse.json({ error: 'PC overview not found' }, { status: 404 });
        }

        return NextResponse.json({ pc });

    } catch (error: unknown) {
        console.error(`Error fetching PC overview ${pcId}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to fetch PC overview', details: message },
            { status: 500 }
        );
    }
}

// DELETE method to remove a PC overview by ID
export async function DELETE(request: NextRequest, context: any): Promise<NextResponse> {
    // Assuming context structure { params: { id: string } }
    const id = context?.params?.id;
    if (typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid or missing PC ID in params' }, { status: 400 });
    }
    const pcId = parseInt(id, 10);

    if (isNaN(pcId)) {
        return NextResponse.json({ error: 'Invalid PC ID format' }, { status: 400 });
    }

    try {
        const affectedRows = await dbUtils.update(
            `DELETE FROM pc_overview WHERE pc_id = ?`,
            [pcId]
        );

        if (affectedRows === 0) {
            return NextResponse.json({ error: 'PC overview not found or already deleted' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: `PC overview with ID ${pcId} deleted successfully.` });

    } catch (error: unknown) {
        console.error(`Error deleting PC overview ${pcId}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        // Check if PCs are referenced (e.g., by licenses)
        if (message.includes('foreign key constraint fails')) {
             return NextResponse.json(
                 { error: `Failed to delete PC overview: It is still referenced by other records (e.g., Licenses).`, details: message },
                 { status: 400 }
             );
         }
        return NextResponse.json(
            { error: 'Failed to delete PC overview', details: message },
            { status: 500 }
        );
    }
} 