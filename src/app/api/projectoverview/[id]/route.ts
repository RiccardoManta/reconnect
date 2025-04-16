import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket } from 'mysql2/promise';

// Interface for Project Overview data (same as in parent route)
interface ProjectOverview extends RowDataPacket {
    overview_id: number;
    bench_id: number;
    hil_name: string; // Joined from test_benches
    platform: string | null;
    system_supplier: string | null;
    wetbench_info: string | null;
    actuator_info: string | null;
    hardware: string | null;
    software: string | null;
    model_version: string | null;
    ticket_notes: string | null;
}

// GET method to fetch a single project overview by ID
export async function GET(request: NextRequest, context: any): Promise<NextResponse> {
    // Assuming context structure { params: { id: string } }
    const id = context?.params?.id;
    if (typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid or missing overview ID in params' }, { status: 400 });
    }
    const overviewId = parseInt(id, 10);

    if (isNaN(overviewId)) {
        return NextResponse.json({ error: 'Invalid overview ID format' }, { status: 400 });
    }

    try {
        const overview = await dbUtils.queryOne<ProjectOverview>(
            `SELECT o.*, t.hil_name
             FROM test_bench_project_overview o
             LEFT JOIN test_benches t ON o.bench_id = t.bench_id
             WHERE o.overview_id = ?`,
            [overviewId]
        );

        if (!overview) {
            return NextResponse.json({ error: 'Project overview not found' }, { status: 404 });
        }

        return NextResponse.json({ projectOverview: overview });

    } catch (error: unknown) {
        console.error(`Error fetching project overview ${overviewId}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to fetch project overview', details: message },
            { status: 500 }
        );
    }
}

// DELETE method to remove a project overview by ID
export async function DELETE(request: NextRequest, context: any): Promise<NextResponse> {
    // Assuming context structure { params: { id: string } }
    const id = context?.params?.id;
    if (typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid or missing overview ID in params' }, { status: 400 });
    }
    const overviewId = parseInt(id, 10);

    if (isNaN(overviewId)) {
        return NextResponse.json({ error: 'Invalid overview ID format' }, { status: 400 });
    }

    try {
        const affectedRows = await dbUtils.update(
            `DELETE FROM test_bench_project_overview WHERE overview_id = ?`,
            [overviewId]
        );

        if (affectedRows === 0) {
            return NextResponse.json({ error: 'Project overview not found or already deleted' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: `Project overview with ID ${overviewId} deleted successfully.` });

    } catch (error: unknown) {
        console.error(`Error deleting project overview ${overviewId}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        // Check if this record is referenced elsewhere (if applicable)
        if (message.includes('foreign key constraint fails')) {
             return NextResponse.json(
                 { error: `Failed to delete project overview: It is still referenced by other records.`, details: message },
                 { status: 400 }
             );
         }
        return NextResponse.json(
            { error: 'Failed to delete project overview', details: message },
            { status: 500 }
        );
    }
} 