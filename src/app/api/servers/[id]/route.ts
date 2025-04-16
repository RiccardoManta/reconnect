import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket } from 'mysql2/promise';

// Interface for ServerApiResponse (same as in parent route)
interface ServerApiResponse extends RowDataPacket {
  bench_id: number;
  hil_name: string | null;
  category: string | null;
  subcategory: string | null;
  description: string | null;
  status: string | null;
  active_user: string | null;
  location: string | null;
}

// GET method to fetch a single server by ID
export async function GET(request: NextRequest, context: any): Promise<NextResponse> {
    // Assuming context structure { params: { id: string } }
    const id = context?.params?.id;
    if (typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid or missing server (bench) ID in params' }, { status: 400 });
    }
    const benchId = parseInt(id, 10);

    if (isNaN(benchId)) {
        return NextResponse.json({ error: 'Invalid server (bench) ID format' }, { status: 400 });
    }

    try {
        // Use the same JOIN query as the main GET route, but filter by bench_id
        const server = await dbUtils.queryOne<ServerApiResponse>(
            `SELECT 
               t.bench_id,
               p.pc_name AS hil_name, 
               o.platform AS category, 
               t.bench_type AS subcategory,
               p.pc_info_text AS description,
               p.status,
               p.active_user,
               t.location
             FROM test_benches t
             LEFT JOIN pc_overview p ON t.bench_id = p.bench_id
             LEFT JOIN test_bench_project_overview o ON t.bench_id = o.bench_id
             WHERE t.bench_id = ?`,
            [benchId]
        );

        if (!server) {
            return NextResponse.json({ error: 'Server not found' }, { status: 404 });
        }

        return NextResponse.json({ server });

    } catch (error: unknown) {
        console.error(`Error fetching server ${benchId}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to fetch server', details: message },
            { status: 500 }
        );
    }
}

// DELETE method to remove a server by ID
// Important: This needs to delete from multiple tables or handle foreign keys correctly!
// For simplicity, we start by deleting from test_benches, 
// but constraints might require deleting from pc_overview and test_bench_project_overview first 
// or setting up cascading deletes in the DB.
export async function DELETE(request: NextRequest, context: any): Promise<NextResponse> {
    // Assuming context structure { params: { id: string } }
    const id = context?.params?.id;
    if (typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid or missing server (bench) ID in params' }, { status: 400 });
    }
    const benchId = parseInt(id, 10);

    if (isNaN(benchId)) {
        return NextResponse.json({ error: 'Invalid server (bench) ID format' }, { status: 400 });
    }

    try {
        // Attempt to delete from the primary table (test_benches)
        // NOTE: This WILL FAIL if foreign key constraints exist in other tables 
        // referencing this bench_id, unless ON DELETE CASCADE is set.
        // A more robust solution would involve a transaction to delete related records first.
        const affectedRows = await dbUtils.update(
            `DELETE FROM test_benches WHERE bench_id = ?`,
            [benchId]
        );

        if (affectedRows === 0) {
            return NextResponse.json({ error: 'Server (test_bench) not found or already deleted' }, { status: 404 });
        }
        
        // Optionally, attempt to delete related records (less safe without transaction)
        // await dbUtils.update(`DELETE FROM pc_overview WHERE bench_id = ?`, [benchId]);
        // await dbUtils.update(`DELETE FROM test_bench_project_overview WHERE bench_id = ?`, [benchId]);

        return NextResponse.json({ success: true, message: `Server (test_bench) with ID ${benchId} deleted successfully. Related records might need manual cleanup if constraints exist.` });

    } catch (error: unknown) {
        console.error(`Error deleting server (test_bench) ${benchId}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        // Check for foreign key errors
        if (message.includes('foreign key constraint fails')) {
             return NextResponse.json(
                 { error: `Failed to delete server (test_bench): It is still referenced by other records (e.g., pc_overview, project_overview, licenses, hardware, etc.). You might need to delete dependent records first or configure cascading deletes.`, details: message },
                 { status: 400 }
             );
         }
        return NextResponse.json(
            { error: 'Failed to delete server (test_bench)', details: message },
            { status: 500 }
        );
    }
} 