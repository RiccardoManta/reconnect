import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { checkApiPermission } from '@/utils/server/permissionUtils';
import { LicenseRequestBody } from '@/types/database';

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

    // API Protection
    const permissionCheck = await checkApiPermission(request, ['Admin', 'Edit']);
    if (!permissionCheck.isAuthorized) {
        return permissionCheck.errorResponse!;
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
    const { license_id } = context.params;
    // API Protection
    const permissionCheck = await checkApiPermission(request, ['Edit', 'Admin']);
    if (!permissionCheck.isAuthorized) {
        return permissionCheck.errorResponse!;
    }

    try {
        const body: Partial<LicenseRequestBody> = await request.json();
        if (Object.keys(body).length === 0) {
            return NextResponse.json({ error: 'Request body is empty' }, { status: 400 });
        }

        const fieldsToUpdate: string[] = [];
        const values: any[] = [];

        // Dynamically build the SET clause
        (Object.keys(body) as Array<keyof LicenseRequestBody>).forEach(key => {
            if (body[key] !== undefined && key !== 'software_id') { // software_id is not usually updatable directly here
                fieldsToUpdate.push(`${key} = ?`);
                values.push(body[key]);
            }
        });
         if (body.software_id !== undefined) { // Allow updating software_id if provided
            fieldsToUpdate.push('software_id = ?');
            values.push(body.software_id);
        }

        if (fieldsToUpdate.length === 0) {
            return NextResponse.json({ error: 'No valid fields provided for update' }, { status: 400 });
        }

        values.push(license_id); // For the WHERE clause

        const affectedRows = await dbUtils.update(
            `UPDATE licenses SET ${fieldsToUpdate.join(', ')} WHERE license_id = ?`,
            values
        );

        if (affectedRows === 0) {
            return NextResponse.json({ error: 'License not found or no changes made' }, { status: 404 });
        }
        const updatedLicense = await dbUtils.queryOne<License>(
            'SELECT l.*, s.software_name FROM licenses l LEFT JOIN software s ON l.software_id = s.software_id WHERE l.license_id = ?',
            [license_id]
        );
        return NextResponse.json({ success: true, license: updatedLicense });

    } catch (error) {
        console.error(`Error updating license ${license_id}:`, error);
        return NextResponse.json({ error: 'Failed to update license' }, { status: 500 });
    }
} 