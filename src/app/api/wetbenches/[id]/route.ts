import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket } from 'mysql2/promise';
import { checkApiPermission } from '@/utils/server/permissionUtils';
import { WetbenchRequestBody } from '@/types/database';

// Interface for Wetbench data (updated to remove platform and use camelCase)
interface Wetbench extends RowDataPacket {
    wetbenchId: number;
    wetbenchName: string;
    ppNumber: string | null;
    owner: string | null;
    systemType: string | null;
    systemSupplier: string | null;
    linkedBenchId: number | null;
    actuatorInfo: string | null;
    hardwareComponents: string | null;
    inventoryNumber: string | null;
}

// GET method to fetch a single wetbench by ID
export async function GET(request: NextRequest, context: any): Promise<NextResponse> {
    const id = context?.params?.id;
    if (typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid or missing wetbench ID in params' }, { status: 400 });
    }
    const wetbenchIdNum = parseInt(id, 10);

    if (isNaN(wetbenchIdNum)) {
        return NextResponse.json({ error: 'Invalid wetbench ID format' }, { status: 400 });
    }

    try {
        const wetbench = await dbUtils.queryOne<Wetbench>(
            `SELECT 
               wetbench_id AS wetbenchId, wetbench_name AS wetbenchName, pp_number AS ppNumber, 
               owner, system_type AS systemType, system_supplier AS systemSupplier, 
               linked_bench_id AS linkedBenchId, actuator_info AS actuatorInfo, 
               hardware_components AS hardwareComponents, inventory_number AS inventoryNumber
             FROM wetbenches WHERE wetbench_id = ?`,
            [wetbenchIdNum]
        );

        if (!wetbench) {
            return NextResponse.json({ error: 'Wetbench not found' }, { status: 404 });
        }

        return NextResponse.json({ wetbench });

    } catch (error: unknown) {
        console.error(`Error fetching wetbench ${wetbenchIdNum}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to fetch wetbench', details: message },
            { status: 500 }
        );
    }
}

// PUT method to update a wetbench by ID
export async function PUT(request: NextRequest, context: any) {
    const { id } = context.params;
    // API Protection
    const permissionCheck = await checkApiPermission(request, ['Edit', 'Admin']);
    if (!permissionCheck.isAuthorized) {
        return permissionCheck.errorResponse!;
    }
    try {
        const body: Partial<WetbenchRequestBody> = await request.json();
        if (Object.keys(body).length === 0) {
            return NextResponse.json({ error: 'Request body is empty' }, { status: 400 });
        }

        const fieldsToUpdate: string[] = [];
        const values: any[] = [];

        (Object.keys(body) as Array<keyof WetbenchRequestBody>).forEach(key => {
            if (body[key] !== undefined) {
                fieldsToUpdate.push(`${key} = ?`);
                values.push(body[key]);
            }
        });

        if (fieldsToUpdate.length === 0) {
            return NextResponse.json({ error: 'No valid fields provided for update' }, { status: 400 });
        }

        values.push(id); // For the WHERE clause

        const affectedRows = await dbUtils.update(
            `UPDATE wetbenches SET ${fieldsToUpdate.join(', ')} WHERE wetbench_id = ?`,
            values
        );

        if (affectedRows === 0) {
            return NextResponse.json({ error: 'Wetbench not found or no changes made' }, { status: 404 });
        }
        const updatedWetbench = await dbUtils.queryOne<Wetbench>(
            'SELECT w.*, tb.hil_name FROM wetbenches w LEFT JOIN test_benches tb ON w.linked_bench_id = tb.bench_id WHERE w.wetbench_id = ?',
            [id]
        );
        return NextResponse.json({ success: true, wetbench: updatedWetbench });

    } catch (error) {
        console.error(`Error updating wetbench ${id}:`, error);
        return NextResponse.json({ error: 'Failed to update wetbench' }, { status: 500 });
    }
}

// DELETE method to remove a wetbench by ID
export async function DELETE(request: NextRequest, context: any): Promise<NextResponse> {
    const { id } = context.params;
    // API Protection
    const permissionCheck = await checkApiPermission(request, ['Admin', 'Edit']);
    if (!permissionCheck.isAuthorized) {
        return permissionCheck.errorResponse!;
    }
    if (typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid or missing wetbench ID in params' }, { status: 400 });
    }
    const wetbenchIdNum = parseInt(id, 10);

    if (isNaN(wetbenchIdNum)) {
        return NextResponse.json({ error: 'Invalid wetbench ID format' }, { status: 400 });
    }

    try {
        const affectedRows = await dbUtils.update(
            `DELETE FROM wetbenches WHERE wetbench_id = ?`,
            [wetbenchIdNum]
        );

        if (affectedRows === 0) {
            return NextResponse.json({ error: 'Wetbench not found or already deleted' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: `Wetbench with ID ${wetbenchIdNum} deleted successfully.` });

    } catch (error: unknown) {
        console.error(`Error deleting wetbench ${wetbenchIdNum}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        if (message.includes('foreign key constraint fails')) {
             return NextResponse.json(
                 { error: `Failed to delete wetbench: It is still referenced by other records. Please update or remove associated records first.`, details: message },
                 { status: 400 }
             );
         }
        return NextResponse.json(
            { error: 'Failed to delete wetbench', details: message },
            { status: 500 }
        );
    }
} 