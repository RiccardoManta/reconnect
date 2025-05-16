import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket } from 'mysql2/promise';
import { checkApiPermission } from '@/utils/server/permissionUtils';

// Interface for Project Overview data (updated for new schema and camelCase)
interface ProjectOverview extends RowDataPacket {
    overviewId: number;
    benchId: number;
    hilName?: string; // Joined from test_benches
    platformId: number | null;
    platformName?: string | null; // Joined from platforms (if main route joins)
    systemSupplier: string | null;
    wetbenchInfo: string | null;
    actuatorInfo: string | null;
    hardware: string | null;
    software: string | null;
    modelVersion: string | null;
    ticketNotes: string | null;
    wetbenchId: number | null; // Added
    wetbenchName?: string | null; // Added, joined from wetbenches
}

// GET method to fetch a single project overview by ID
export async function GET(request: NextRequest, context: any): Promise<NextResponse> {
    const id = context?.params?.id;
    if (typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid or missing overview ID in params' }, { status: 400 });
    }
    const overviewIdNum = parseInt(id, 10);

    if (isNaN(overviewIdNum)) {
        return NextResponse.json({ error: 'Invalid overview ID format' }, { status: 400 });
    }

    try {
        // Updated query to join with platforms and wetbenches for names
        const overview = await dbUtils.queryOne<ProjectOverview>(
            `SELECT 
               o.overview_id AS overviewId,
               o.bench_id AS benchId,
               t.hil_name AS hilName,
               o.platform_id AS platformId,
               p.platform_name AS platformName,
               o.system_supplier AS systemSupplier,
               o.wetbench_info AS wetbenchInfo,
               o.actuator_info AS actuatorInfo,
               o.hardware,
               o.software,
               o.model_version AS modelVersion,
               o.ticket_notes AS ticketNotes,
               o.wetbench_id AS wetbenchId,
               wb.wetbench_name AS wetbenchName
             FROM test_bench_project_overview o
             LEFT JOIN test_benches t ON o.bench_id = t.bench_id
             LEFT JOIN platforms p ON o.platform_id = p.platform_id
             LEFT JOIN wetbenches wb ON o.wetbench_id = wb.wetbench_id
             WHERE o.overview_id = ?`,
            [overviewIdNum]
        );

        if (!overview) {
            return NextResponse.json({ error: 'Project overview not found' }, { status: 404 });
        }

        return NextResponse.json({ projectOverview: overview });

    } catch (error: unknown) {
        console.error(`Error fetching project overview ${overviewIdNum}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to fetch project overview', details: message },
            { status: 500 }
        );
    }
}

// DELETE method to remove a project overview by ID
export async function DELETE(request: NextRequest, context: any): Promise<NextResponse> {
    const { id } = context.params; // overview_id
    // API Protection
    const permissionCheck = await checkApiPermission(request, ['Admin', 'Edit']);
    if (!permissionCheck.isAuthorized) {
        return permissionCheck.errorResponse!;
    }
    if (typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid or missing overview ID in params' }, { status: 400 });
    }
    const overviewIdNum = parseInt(id, 10);

    if (isNaN(overviewIdNum)) {
        return NextResponse.json({ error: 'Invalid overview ID format' }, { status: 400 });
    }

    try {
        const affectedRows = await dbUtils.update(
            `DELETE FROM test_bench_project_overview WHERE overview_id = ?`,
            [overviewIdNum]
        );

        if (affectedRows === 0) {
            return NextResponse.json({ error: 'Project overview not found or already deleted' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: `Project overview with ID ${overviewIdNum} deleted successfully.` });

    } catch (error: unknown) {
        console.error(`Error deleting project overview ${overviewIdNum}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
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