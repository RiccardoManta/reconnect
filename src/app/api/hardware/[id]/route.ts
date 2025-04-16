import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket } from 'mysql2/promise';

// Interface for HardwareInstallation data (same as in parent route)
interface HardwareInstallation extends RowDataPacket {
    install_id: number;
    bench_id: number;
    hil_name: string; // Joined from test_benches
    ecu_info: string | null;
    sensors: string | null;
    additional_periphery: string | null;
}

// GET method to fetch a single hardware installation by ID
export async function GET(request: NextRequest, context: any): Promise<NextResponse> {
    // Assuming context structure { params: { id: string } }
    const id = context?.params?.id;
    if (typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid or missing installation ID in params' }, { status: 400 });
    }
    const installId = parseInt(id, 10);

    if (isNaN(installId)) {
        return NextResponse.json({ error: 'Invalid installation ID format' }, { status: 400 });
    }

    try {
        const hardware = await dbUtils.queryOne<HardwareInstallation>(
             `SELECT h.*, t.hil_name
              FROM hardware_installation h
              LEFT JOIN test_benches t ON h.bench_id = t.bench_id
              WHERE h.install_id = ?`,
            [installId]
        );

        if (!hardware) {
            return NextResponse.json({ error: 'Hardware installation not found' }, { status: 404 });
        }

        return NextResponse.json({ hardware });

    } catch (error: unknown) {
        console.error(`Error fetching hardware installation ${installId}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to fetch hardware installation', details: message },
            { status: 500 }
        );
    }
}

// DELETE method to remove a hardware installation by ID
export async function DELETE(request: NextRequest, context: any): Promise<NextResponse> {
     // Assuming context structure { params: { id: string } }
    const id = context?.params?.id;
    if (typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid or missing installation ID in params' }, { status: 400 });
    }
    const installId = parseInt(id, 10);

    if (isNaN(installId)) {
        return NextResponse.json({ error: 'Invalid installation ID format' }, { status: 400 });
    }

    try {
        const affectedRows = await dbUtils.update(
            `DELETE FROM hardware_installation WHERE install_id = ?`,
            [installId]
        );

        if (affectedRows === 0) {
            return NextResponse.json({ error: 'Hardware installation not found or already deleted' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: `Hardware installation with ID ${installId} deleted successfully.` });

    } catch (error: unknown) {
        console.error(`Error deleting hardware installation ${installId}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        if (message.includes('foreign key constraint fails')) {
             return NextResponse.json(
                 { error: `Failed to delete hardware installation: It is still referenced by other records.`, details: message },
                 { status: 400 }
             );
         }
        return NextResponse.json(
            { error: 'Failed to delete hardware installation', details: message },
            { status: 500 }
        );
    }
} 