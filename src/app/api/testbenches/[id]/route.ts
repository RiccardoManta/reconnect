import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// Interface for Test Bench data (same as in the parent route)
interface TestBench extends RowDataPacket {
    bench_id: number;
    hil_name: string;
    pp_number: string | null;
    system_type: string | null;
    bench_type: string | null;
    acquisition_date: string | null;
    location: string | null;
    user_id: number | null;
    user_name: string | null;
    project_id: number | null;
    project_name: string | null;
}

// GET method to fetch a single test bench by ID
export async function GET(request: NextRequest, context: any): Promise<NextResponse> {
    // Assuming context structure { params: { id: string } }
    const id = context?.params?.id;
    if (typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid or missing bench ID in params' }, { status: 400 });
    }
    const benchId = parseInt(id, 10);

    if (isNaN(benchId)) {
        return NextResponse.json({ error: 'Invalid bench ID format' }, { status: 400 });
    }

    try {
        const testBench = await dbUtils.queryOne<TestBench>(
            `SELECT 
               t.bench_id, t.hil_name, t.pp_number, t.system_type, t.bench_type, 
               t.acquisition_date, t.location, t.user_id, u.user_name, 
               t.project_id, p.project_name
             FROM test_benches t
             LEFT JOIN users u ON t.user_id = u.user_id
             LEFT JOIN projects p ON t.project_id = p.project_id
             WHERE t.bench_id = ?`,
            [benchId]
        );

        if (!testBench) {
            return NextResponse.json({ error: 'Test bench not found' }, { status: 404 });
        }

        return NextResponse.json({ testBench });

    } catch (error: unknown) {
        console.error(`Error fetching test bench ${benchId}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to fetch test bench', details: message },
            { status: 500 }
        );
    }
}

// DELETE method to remove a test bench by ID
export async function DELETE(request: NextRequest, context: any): Promise<NextResponse> {
    // Assuming context structure { params: { id: string } }
    const id = context?.params?.id;
    if (typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid or missing bench ID in params' }, { status: 400 });
    }
    const benchId = parseInt(id, 10);

    if (isNaN(benchId)) {
        return NextResponse.json({ error: 'Invalid bench ID format' }, { status: 400 });
    }

    try {
        // Use dbUtils.update for DELETE operations as it returns affectedRows
        const affectedRows = await dbUtils.update(
            `DELETE FROM test_benches WHERE bench_id = ?`,
            [benchId]
        );

        if (affectedRows === 0) {
            return NextResponse.json({ error: 'Test bench not found or already deleted' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: `Test bench with ID ${benchId} deleted successfully.` });

    } catch (error: unknown) {
        console.error(`Error deleting test bench ${benchId}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
         // Specific check for foreign key constraints (if other tables reference this one)
        if (message.includes('foreign key constraint fails')) {
            return NextResponse.json(
                { error: `Failed to delete test bench: It is still referenced by other records (e.g., PCs, Project Overviews). Please remove associated records first.`, details: message },
                { status: 400 } // Bad request due to constraint violation
            );
        }
        return NextResponse.json(
            { error: 'Failed to delete test bench', details: message },
            { status: 500 }
        );
    }
} 