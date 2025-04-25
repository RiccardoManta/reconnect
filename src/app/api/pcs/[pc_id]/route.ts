import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket } from 'mysql2/promise';

// Interface for PC Overview data (same as in parent route)
interface PcOverview extends RowDataPacket {
    pc_id: number;
    bench_id: number | null; // Updated based on schema check
    pc_name: string | null;  // Updated based on schema check
    casual_name: string | null; // Added based on schema check
    purchase_year: number | null;
    inventory_number: string | null;
    pc_role: string | null;
    pc_model: string | null;
    special_equipment: string | null;
    mac_address: string | null;
    ip_address: string | null;
    // Removed active_licenses, installed_tools - not in schema
    pc_info_text: string | null;
    status: string | null;
    active_user: string | null;
}

// GET method to fetch a single PC overview by pc_id
export async function GET(
    request: NextRequest, 
    // Using 'any' because the specific type { params: { pc_id: string } } 
    // caused persistent build errors in the Docker environment (Next.js 15.3.0).
    context: any 
): Promise<NextResponse> {
    const pcIdStr = context?.params?.pc_id; // Access should still work
    if (typeof pcIdStr !== 'string') {
        return NextResponse.json({ error: 'Invalid or missing PC ID in params' }, { status: 400 });
    }
    const pcId = parseInt(pcIdStr, 10);

    if (isNaN(pcId)) {
        return NextResponse.json({ error: 'Invalid PC ID format' }, { status: 400 });
    }

    try {
        // Explicitly select columns based on corrected interface
        const pc = await dbUtils.queryOne<PcOverview>(
            `SELECT pc_id, bench_id, pc_name, casual_name, purchase_year, inventory_number, 
                    pc_role, pc_model, special_equipment, mac_address, ip_address, 
                    pc_info_text, status, active_user 
             FROM pc_overview WHERE pc_id = ?`,
            [pcId]
        );

        if (!pc) {
            return NextResponse.json({ error: 'PC overview not found' }, { status: 404 });
        }

        return NextResponse.json({ pc }); // Return { pc: ... }

    } catch (error: unknown) {
        console.error(`Error fetching PC overview ${pcId}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to fetch PC overview', details: message },
            { status: 500 }
        );
    }
}

// DELETE method to remove a PC overview by pc_id
export async function DELETE(
    request: NextRequest, 
    // Using 'any' because the specific type { params: { pc_id: string } } 
    // caused persistent build errors in the Docker environment (Next.js 15.3.0).
    context: any 
): Promise<NextResponse> {
    const pcIdStr = context?.params?.pc_id; // Access should still work
    if (typeof pcIdStr !== 'string') {
        return NextResponse.json({ error: 'Invalid or missing PC ID in params' }, { status: 400 });
    }
    const pcId = parseInt(pcIdStr, 10);

    if (isNaN(pcId)) {
        return NextResponse.json({ error: 'Invalid PC ID format' }, { status: 400 });
    }

    try {
        // Use dbUtils.update for DELETE as it returns affectedRows
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
        // Check if PCs are referenced (e.g., by licenses, pc_software)
        if (message.includes('foreign key constraint fails')) {
             return NextResponse.json(
                 { error: `Failed to delete PC overview: It is still referenced by other records (e.g., Licenses, Software Assignments).`, details: message },
                 { status: 400 } // 409 Conflict might be more appropriate
             );
         }
        return NextResponse.json(
            { error: 'Failed to delete PC overview', details: message },
            { status: 500 }
        );
    }
} 