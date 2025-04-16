import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket } from 'mysql2/promise';

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

// DELETE method to remove an HIL operation by ID
export async function DELETE(request: NextRequest, context: any): Promise<NextResponse> {
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