import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// Interface for License data (matches the one in parent route)
interface License extends RowDataPacket {
    license_id: number;
    // Corrected fields based on schema.sql
    software_id: number;
    license_name: string | null;        
    license_description: string | null;
    license_number: string | null;
    dongle_number: string | null;
    activation_key: string | null;
    system_id: string | null;        
    license_user: string | null;        
    maintenance_end: string | null;   
    owner: string | null;             
    license_type: string | null;         
    remarks: string | null; 
}

// Define the request body structure for PUT
// Should match the fields sent from handleUpdateLicense after snake_case conversion
interface LicensePutBody {
    license_id: number; // Included in body by frontend?
    software_id: number;
    license_name?: string | null;
    license_description?: string | null;
    license_number?: string | null;
    dongle_number?: string | null;
    activation_key?: string | null;
    system_id?: string | null;
    license_user?: string | null;
    maintenance_end?: string | null;
    owner?: string | null;
    license_type?: string | null;
    remarks?: string | null;
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

// PUT method to update an existing license by ID
export async function PUT(request: NextRequest, context: any): Promise<NextResponse> {
    const licenseIdStr = context?.params?.license_id;
    if (typeof licenseIdStr !== 'string') {
        return NextResponse.json({ error: 'Invalid or missing license ID in URL path' }, { status: 400 });
    }
    const licenseId = parseInt(licenseIdStr, 10);
    if (isNaN(licenseId)) {
        return NextResponse.json({ error: 'Invalid license ID format' }, { status: 400 });
    }

    try {
        const body: LicensePutBody = await request.json();

        if (body.license_id !== undefined && body.license_id !== licenseId) {
            return NextResponse.json({ error: 'License ID mismatch between URL and request body' }, { status: 400 });
        }
        if (body.software_id === undefined || body.software_id === null) {
            return NextResponse.json({ error: 'Software ID (software_id) is required' }, { status: 400 });
        }

        const affectedRows = await dbUtils.transaction<number>(async (connection) => {
            const softwareExists = await connection.query<RowDataPacket[]>('SELECT software_id FROM software WHERE software_id = ?', [body.software_id]);
            if (!softwareExists[0] || softwareExists[0].length === 0) {
                throw new Error(`Referenced Software with ID ${body.software_id} not found.`);
            }

            const updateQuery = `
                UPDATE licenses SET
                    software_id = ?,
                    license_name = ?,
                    license_description = ?,
                    license_number = ?,
                    dongle_number = ?,
                    activation_key = ?,
                    system_id = ?,
                    license_user = ?,
                    maintenance_end = ?,
                    owner = ?,
                    license_type = ?,
                    remarks = ?
                WHERE license_id = ?
            `;
            const updateValues = [
                body.software_id,
                body.license_name || null,
                body.license_description || null,
                body.license_number || null,
                body.dongle_number || null,
                body.activation_key || null,
                body.system_id || null,
                body.license_user || null,
                body.maintenance_end || null,
                body.owner || null,
                body.license_type || null,
                body.remarks || null,
                licenseId
            ];

            const [result] = await connection.query<ResultSetHeader>(updateQuery, updateValues);
            if (result.affectedRows === 0) {
                const licenseExists = await connection.query<RowDataPacket[]>('SELECT license_id FROM licenses WHERE license_id = ?', [licenseId]);
                if (!licenseExists[0] || licenseExists[0].length === 0) {
                    throw new Error(`License with ID ${licenseId} not found.`);
                }
            }
            return result.affectedRows;
        });

        const updatedLicense = await dbUtils.queryOne<License>(
            `SELECT * FROM licenses WHERE license_id = ?`,
            [licenseId]
        );

        if (!updatedLicense) {
            return NextResponse.json({ error: 'Failed to retrieve license after update.' }, { status: 404 });
        }

        return NextResponse.json({ 
            success: true, 
            message: affectedRows > 0 ? 'License updated successfully' : 'License update successful (no changes detected)', 
            license: updatedLicense
        });

    } catch (error: unknown) {
        console.error(`[API PUT /api/licenses/${licenseId}] Error:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
         if (message.includes('foreign key constraint fails')) {
            return NextResponse.json(
                { error: `Failed to update license: Invalid software_id.`, details: message },
                { status: 400 }
            );
        }
         if (message.includes('not found')) {
             return NextResponse.json({ error: message }, { status: 404 });
         }
        return NextResponse.json(
            { error: 'Failed to update license', details: message },
            { status: 500 }
        );
    }
} 