import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket } from 'mysql2/promise';
import { checkApiPermission } from '@/utils/server/permissionUtils';
import { HilOperation as HilOperationType, HilOperationRequestBody } from '@/types/database';

// Interface for HIL Operation data (same as in parent route)
interface HilOperation extends RowDataPacket {
    operation_id: number;
    bench_id: number;
    hil_name: string; // Joined from test_benches
    possible_tests: string | null;
    vehicle_datasets: string | null;
    scenarios: string | null;
    controldesk_projects: string | null;
}

// GET method to fetch a single HIL operation by ID
export async function GET(request: NextRequest, context: any): Promise<NextResponse> {
    // Assuming context structure { params: { id: string } }
    const id = context?.params?.id;
    if (typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid or missing operation ID in params' }, { status: 400 });
    }
    const operationId = parseInt(id, 10);

    if (isNaN(operationId)) {
        return NextResponse.json({ error: 'Invalid operation ID format' }, { status: 400 });
    }

    try {
        const operation = await dbUtils.queryOne<HilOperation>(
            `SELECT o.*, t.hil_name
             FROM hil_operation o
             LEFT JOIN test_benches t ON o.bench_id = t.bench_id
             WHERE o.operation_id = ?`,
            [operationId]
        );

        if (!operation) {
            return NextResponse.json({ error: 'HIL operation not found' }, { status: 404 });
        }

        return NextResponse.json({ operation });

    } catch (error: unknown) {
        console.error(`Error fetching HIL operation ${operationId}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to fetch HIL operation', details: message },
            { status: 500 }
        );
    }
}

// PUT method to update an HIL operation by ID
export async function PUT(request: NextRequest, context: any) {
    const { id } = context.params; // operation_id
    // API Protection
    const permissionCheck = await checkApiPermission(request, ['Edit', 'Admin']);
    if (!permissionCheck.isAuthorized) {
        return permissionCheck.errorResponse!;
    }
    
    let requestBody: Partial<HilOperationRequestBody> | null = null;

    try {
        requestBody = await request.json(); 
        if (!requestBody) { 
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }
        const body = requestBody;

        if (Object.keys(body).length === 0 && body.bench_id === undefined) { 
             return NextResponse.json({ error: 'Request body is empty or missing bench_id for update' }, { status: 400 });
        }

        const fieldsToUpdate: string[] = [];
        const values: any[] = [];

        if (body.bench_id !== undefined) { fieldsToUpdate.push('bench_id = ?'); values.push(body.bench_id); }
        if (body.possible_tests !== undefined) { fieldsToUpdate.push('possible_tests = ?'); values.push(body.possible_tests); }
        if (body.vehicle_datasets !== undefined) { fieldsToUpdate.push('vehicle_datasets = ?'); values.push(body.vehicle_datasets); }
        if (body.scenarios !== undefined) { fieldsToUpdate.push('scenarios = ?'); values.push(body.scenarios); }
        if (body.controldesk_projects !== undefined) { fieldsToUpdate.push('controldesk_projects = ?'); values.push(body.controldesk_projects); }

        if (fieldsToUpdate.length === 0) {
            return NextResponse.json({ error: 'No valid fields provided for update' }, { status: 400 });
        }

        values.push(id); // For the WHERE operation_id = ?

        const affectedRows = await dbUtils.update(
            `UPDATE hil_operation SET ${fieldsToUpdate.join(', ')} WHERE operation_id = ?`,
            values
        );

        if (affectedRows === 0) {
            const exists = await dbUtils.queryOne<HilOperationType>('SELECT operation_id FROM hil_operation WHERE operation_id = ?', [id]);
            if (!exists) {
                return NextResponse.json({ error: 'HIL Operation not found' }, { status: 404 });
            }
            return NextResponse.json({ message: 'No changes applied to HIL Operation', status: 'no_change' }, { status: 200 });
        }

        const updatedEntry = await dbUtils.queryOne<HilOperationType>(
            `SELECT ho.*, tb.hil_name 
             FROM hil_operation ho
             JOIN test_benches tb ON ho.bench_id = tb.bench_id
             WHERE ho.operation_id = ?`,
            [id]
        );
        return NextResponse.json({ success: true, hil_operation: updatedEntry });

    } catch (error: unknown) {
        console.error(`Error updating HIL Operation ${id}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        if (message.includes('foreign key constraint fails') && requestBody && requestBody.bench_id !== undefined) {
            return NextResponse.json(
                { error: `Failed to update HIL Operation: Invalid bench_id ${requestBody.bench_id}.`, details: message },
                { status: 400 }
            );
        }
        return NextResponse.json({ error: 'Failed to update HIL Operation' , details: message}, { status: 500 });
    }
}

// DELETE method to remove an HIL operation by ID
export async function DELETE(request: NextRequest, context: any): Promise<NextResponse> {
    const { id } = context.params; // operation_id
    // API Protection
    const permissionCheck = await checkApiPermission(request, ['Admin', 'Edit']);
    if (!permissionCheck.isAuthorized) {
        return permissionCheck.errorResponse!;
    }
    if (typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid or missing operation ID in params' }, { status: 400 });
    }
    const operationId = parseInt(id, 10);

    if (isNaN(operationId)) {
        return NextResponse.json({ error: 'Invalid operation ID format' }, { status: 400 });
    }

    try {
        const affectedRows = await dbUtils.update(
            `DELETE FROM hil_operation WHERE operation_id = ?`,
            [operationId]
        );

        if (affectedRows === 0) {
            return NextResponse.json({ error: 'HIL operation not found or already deleted' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: `HIL operation with ID ${operationId} deleted successfully.` });

    } catch (error: unknown) {
        console.error(`Error deleting HIL operation ${operationId}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        if (message.includes('foreign key constraint fails')) {
             return NextResponse.json(
                 { error: `Failed to delete HIL operation: It is still referenced by other records.`, details: message },
                 { status: 400 }
             );
         }
        return NextResponse.json(
            { error: 'Failed to delete HIL operation', details: message },
            { status: 500 }
        );
    }
} 