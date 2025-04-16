import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket } from 'mysql2/promise';

// Interface for HIL Technology data (same as in parent route)
interface HilTechnology extends RowDataPacket {
    tech_id: number;
    bench_id: number;
    hil_name: string; // Joined from test_benches
    fiu_info: string | null;
    io_info: string | null;
    can_interface: string | null;
    power_interface: string | null;
    possible_tests: string | null;
    leakage_module: string | null;
}

// GET method to fetch a single HIL technology record by ID
export async function GET(request: NextRequest, context: any): Promise<NextResponse> {
    // Assuming context structure { params: { id: string } }
    const id = context?.params?.id;
     if (typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid or missing technology ID in params' }, { status: 400 });
    }
    const techId = parseInt(id, 10);

    if (isNaN(techId)) {
        return NextResponse.json({ error: 'Invalid technology ID format' }, { status: 400 });
    }

    try {
        const technology = await dbUtils.queryOne<HilTechnology>(
             `SELECT h.*, t.hil_name 
              FROM hil_technology h
              LEFT JOIN test_benches t ON h.bench_id = t.bench_id
              WHERE h.tech_id = ?`,
            [techId]
        );

        if (!technology) {
            return NextResponse.json({ error: 'HIL technology record not found' }, { status: 404 });
        }

        return NextResponse.json({ technology });

    } catch (error: unknown) {
        console.error(`Error fetching HIL technology ${techId}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to fetch HIL technology', details: message },
            { status: 500 }
        );
    }
}

// DELETE method to remove an HIL technology record by ID
export async function DELETE(request: NextRequest, context: any): Promise<NextResponse> {
    // Assuming context structure { params: { id: string } }
    const id = context?.params?.id;
     if (typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid or missing technology ID in params' }, { status: 400 });
    }
    const techId = parseInt(id, 10);

    if (isNaN(techId)) {
        return NextResponse.json({ error: 'Invalid technology ID format' }, { status: 400 });
    }

    try {
        const affectedRows = await dbUtils.update(
            `DELETE FROM hil_technology WHERE tech_id = ?`,
            [techId]
        );

        if (affectedRows === 0) {
            return NextResponse.json({ error: 'HIL technology record not found or already deleted' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: `HIL technology with ID ${techId} deleted successfully.` });

    } catch (error: unknown) {
        console.error(`Error deleting HIL technology ${techId}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        if (message.includes('foreign key constraint fails')) {
             return NextResponse.json(
                 { error: `Failed to delete HIL technology: It is still referenced by other records.`, details: message },
                 { status: 400 }
             );
         }
        return NextResponse.json(
            { error: 'Failed to delete HIL technology', details: message },
            { status: 500 }
        );
    }
} 