import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket } from 'mysql2/promise';

// Interface for License data (same as in parent route)
interface License extends RowDataPacket {
    license_id: number;
    tool_name: string;
    license_number: string | null;
    maintenance_end: string | null;
    owner: string | null;
    assigned_pc_id: number | null;
}

// GET method to fetch a single license by ID
export async function GET(request: NextRequest, context: any): Promise<NextResponse> {
    // Assuming context structure { params: { id: string } }
    const id = context?.params?.id;
     if (typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid or missing license ID in params' }, { status: 400 });
    }
    const licenseId = parseInt(id, 10);

    if (isNaN(licenseId)) {
        return NextResponse.json({ error: 'Invalid license ID format' }, { status: 400 });
    }

    try {
        const license = await dbUtils.queryOne<License>(
            `SELECT * FROM licenses WHERE license_id = ?`,
            [licenseId]
        );

        if (!license) {
            return NextResponse.json({ error: 'License not found' }, { status: 404 });
        }

        return NextResponse.json({ license });

    } catch (error: unknown) {
        console.error(`Error fetching license ${licenseId}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to fetch license', details: message },
            { status: 500 }
        );
    }
}

// DELETE method to remove a license by ID
export async function DELETE(request: NextRequest, context: any): Promise<NextResponse> {
    // Assuming context structure { params: { id: string } }
    const id = context?.params?.id;
     if (typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid or missing license ID in params' }, { status: 400 });
    }
    const licenseId = parseInt(id, 10);

    if (isNaN(licenseId)) {
        return NextResponse.json({ error: 'Invalid license ID format' }, { status: 400 });
    }

    try {
        const affectedRows = await dbUtils.update(
            `DELETE FROM licenses WHERE license_id = ?`,
            [licenseId]
        );

        if (affectedRows === 0) {
            return NextResponse.json({ error: 'License not found or already deleted' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: `License with ID ${licenseId} deleted successfully.` });

    } catch (error: unknown) {
        console.error(`Error deleting license ${licenseId}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        // Licenses might be referenced elsewhere, add check if needed
        if (message.includes('foreign key constraint fails')) {
             return NextResponse.json(
                 { error: `Failed to delete license: It is still referenced by other records.`, details: message },
                 { status: 400 }
             );
         }
        return NextResponse.json(
            { error: 'Failed to delete license', details: message },
            { status: 500 }
        );
    }
} 