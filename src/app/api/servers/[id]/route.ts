import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

// UPDATE ServerApiResponse to match standardized fields
interface ServerApiResponse extends RowDataPacket {
  dbId: number; // was bench_id, now pc_id
  casual_name: string | null;
  platform: string | null;
  bench_type: string | null;
  pc_info_text: string | null;
  status: string | null;
  user_name: string | null;
}

// UPDATE Request body interface to match standardized fields
interface ServerRequestBody {
    casual_name: string; 
    platform?: string; 
    bench_type?: string; 
    pc_info_text?: string; 
    user_name?: string; 
}

// UPDATE GET method to fetch a single server by pc_id
export async function GET(request: NextRequest, context: any): Promise<NextResponse> {
    const id = context?.params?.id;
    if (typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid or missing server (pc) ID in params' }, { status: 400 });
    }
    const pcId = parseInt(id, 10);

    if (isNaN(pcId)) {
        return NextResponse.json({ error: 'Invalid server (pc) ID format' }, { status: 400 });
    }

    try {
        // Use the updated standardized JOIN query, filtering by pc_id
        const server = await dbUtils.queryOne<ServerApiResponse>(
            `SELECT 
               p.pc_id AS dbId,
               p.casual_name,
               o.platform,
               t.bench_type,
               p.pc_info_text,
               p.status,
               p.active_user AS user_name
             FROM pc_overview p
             LEFT JOIN test_benches t ON p.bench_id = t.bench_id
             LEFT JOIN test_bench_project_overview o ON t.bench_id = o.bench_id
             WHERE p.pc_id = ?`,
            [pcId]
        );

        if (!server) {
            return NextResponse.json({ error: 'Server (pc) not found' }, { status: 404 });
        }

        return NextResponse.json({ server });

    } catch (error: unknown) {
        console.error(`Error fetching server (pc) ${pcId}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to fetch server (pc)', details: message },
            { status: 500 }
        );
    }
}

// IMPLEMENT PUT method to update an existing server by pc_id
export async function PUT(request: NextRequest, context: any): Promise<NextResponse> { 
  const id = context?.params?.id;
  if (typeof id !== 'string') {
      return NextResponse.json({ error: 'Invalid or missing server (pc) ID in params' }, { status: 400 });
  }
  const pcId = parseInt(id, 10);

  if (isNaN(pcId)) {
      return NextResponse.json({ error: 'Invalid server (pc) ID format' }, { status: 400 });
  }

  try {
    const body: ServerRequestBody = await request.json();
    // DEBUG: Log incoming body
    console.log(`[PUT /api/servers/${pcId}] Received body:`, JSON.stringify(body, null, 2));
    
    // Validation: Use the correct fields now expected
    if (!body.casual_name || !body.platform || !body.pc_info_text) { 
      return NextResponse.json({ error: 'Casual Name, Platform, and PC Info Text are required for update' }, { status: 400 });
    }

    let updatedServer: ServerApiResponse | null = null;
    let associatedBenchId: number | null = null;

    // Use dbUtils.transaction
    await dbUtils.transaction(async (connection: PoolConnection) => {
      // 1. Check PC existence, get bench_id and current status
      // DEBUG: Log before query 1
      console.log(`[PUT /api/servers/${pcId}] Query 1: Fetching bench_id, status for pc_id: ${pcId}`);
      const [pcRows] = await connection.query<RowDataPacket[] & { bench_id: number | null, status: string | null }>(
        'SELECT bench_id, status FROM pc_overview WHERE pc_id = ?',
        [pcId]
      );
      if (pcRows.length === 0) {
           throw new Error('Server (pc) not found');
      }
      associatedBenchId = pcRows[0].bench_id;
      const currentDbStatus = pcRows[0].status?.toLowerCase();
      // DEBUG: Log result of query 1
      console.log(`[PUT /api/servers/${pcId}] Found bench_id: ${associatedBenchId}, currentStatus: ${currentDbStatus}`);

      // 2. Determine the new status based on user and current DB status (keep this logic)
      let newStatus: string;
      const hasUser = body.user_name && body.user_name.trim() !== '';
      if (currentDbStatus === 'offline') {
          newStatus = 'offline'; 
      } else if (hasUser) {
          newStatus = 'in_use'; 
      } else {
          newStatus = 'online'; 
      }
      // DEBUG: Log calculated status
      console.log(`[PUT /api/servers/${pcId}] Calculated newStatus: ${newStatus}`);

      // 3. Update pc_overview using connection.execute
      const pcUpdateSql = `
        UPDATE pc_overview SET 
            pc_name = ?, 
            casual_name = ?, 
            pc_info_text = ?, 
            status = ?, 
            active_user = ? 
         WHERE pc_id = ?`;
      const pcUpdateParams = [
          body.casual_name || null, 
          body.casual_name || null,
          body.pc_info_text || null, 
          newStatus, 
          body.user_name || null,
          pcId
      ];
      console.log(`[PUT /api/servers/${pcId}] Query 3: Executing pc_overview update with params:`, pcUpdateParams);
      // Use execute instead of query - capture result
      const [pcUpdateResult] = await connection.execute<ResultSetHeader>(pcUpdateSql, pcUpdateParams);
      // DEBUG: Log affected rows for pc_overview update
      console.log(`[PUT /api/servers/${pcId}] Query 3 Result: Affected Rows = ${pcUpdateResult.affectedRows}`);
      if (pcUpdateResult.affectedRows === 0) {
        console.warn(`[PUT /api/servers/${pcId}] WARNING: pc_overview update affected 0 rows for pc_id ${pcId}.`);
        // Consider if this should be an error: throw new Error('Failed to update pc_overview record.');
      }
      
      // 4. Update associated test_benches using connection.execute
      if (associatedBenchId) {
          const benchUpdateSql = `
            UPDATE test_benches SET 
                hil_name = ?, 
                bench_type = ? 
             WHERE bench_id = ?`;
          const benchUpdateParams = [ 
              body.casual_name, 
              body.bench_type || null,
              associatedBenchId
          ];
          console.log(`[PUT /api/servers/${pcId}] Query 4: Executing test_benches update for bench_id ${associatedBenchId} with params:`, benchUpdateParams);
           // Use execute instead of query
          await connection.execute(benchUpdateSql, benchUpdateParams);
          
          // 5. Update or Insert test_bench_project_overview if bench_id exists
          //    Explicitly check then update/insert based on bench_id existence
          const [existingOverview] = await connection.query<RowDataPacket[]>(
            'SELECT overview_id FROM test_bench_project_overview WHERE bench_id = ? LIMIT 1',
            [associatedBenchId]
          );

          const platformValue = body.platform || 'Uncategorized';

          if (existingOverview.length > 0) {
            // Row exists, UPDATE it
            const overviewUpdateSql = `UPDATE test_bench_project_overview SET platform = ? WHERE bench_id = ?`;
            const overviewUpdateParams = [platformValue, associatedBenchId];
            console.log(`[PUT /api/servers/${pcId}] Query 5a: Updating existing test_bench_project_overview for bench_id ${associatedBenchId} with params:`, overviewUpdateParams);
            await connection.execute(overviewUpdateSql, overviewUpdateParams);
          } else {
            // Row does NOT exist, INSERT it
            const overviewInsertSql = `INSERT INTO test_bench_project_overview (bench_id, platform) VALUES (?, ?)`;
            const overviewInsertParams = [associatedBenchId, platformValue];
            console.log(`[PUT /api/servers/${pcId}] Query 5b: Inserting new test_bench_project_overview for bench_id ${associatedBenchId} with params:`, overviewInsertParams);
            await connection.execute(overviewInsertSql, overviewInsertParams);
          }
      } else {
          // DEBUG: Log if skipping bench updates
          console.log(`[PUT /api/servers/${pcId}] Skipping test_benches/overview updates as associatedBenchId is null.`);
      }
      
    }); // End transaction

    // Fetch the updated server data outside the transaction using the standardized query
    updatedServer = await dbUtils.queryOne<ServerApiResponse>(
        `SELECT 
          p.pc_id AS dbId,
          p.casual_name,
          o.platform,
          t.bench_type,
          p.pc_info_text,
          p.status,
          p.active_user AS user_name
        FROM pc_overview p
        LEFT JOIN test_benches t ON p.bench_id = t.bench_id
        LEFT JOIN test_bench_project_overview o ON t.bench_id = o.bench_id
        WHERE p.pc_id = ?`, 
        [pcId]
    );
    // DEBUG: Log final fetched data
    console.log(`[PUT /api/servers/${pcId}] Fetched updated data:`, updatedServer);

    if (!updatedServer) {
        // This case might happen if the pc record was somehow deleted between transaction and fetch
        return NextResponse.json({ error: 'Failed to retrieve updated server (pc) data' }, { status: 404 });
    }
      
    return NextResponse.json({ 
      success: true, 
      message: 'Server (pc) updated successfully',
      server: updatedServer
    });
      
  } catch (error: unknown) {
    // DEBUG: Log the full error object in the catch block
    console.error(`[PUT /api/servers/${pcId}] Error updating server (pc):`, error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    // Handle specific errors like 'Server (pc) not found' from the transaction
    if (message === 'Server (pc) not found') {
        return NextResponse.json({ error: message }, { status: 404 });
    }
    console.error(`Error updating server (pc) ${pcId}:`, error);
    return NextResponse.json(
      { error: 'Failed to update server (pc)', details: message },
      { status: 500 }
    );
  }
}

// UPDATE DELETE method to remove a server by pc_id
export async function DELETE(request: NextRequest, context: any): Promise<NextResponse> {
    const id = context?.params?.id;
    if (typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid or missing server (pc) ID in params' }, { status: 400 });
    }
    const pcId = parseInt(id, 10);

    if (isNaN(pcId)) {
        return NextResponse.json({ error: 'Invalid server (pc) ID format' }, { status: 400 });
    }

    try {
        // Delete directly from pc_overview based on pc_id
        // This will remove the entry corresponding to the server card.
        // It does NOT delete the associated test_bench entry.
        const affectedRows = await dbUtils.update(
            `DELETE FROM pc_overview WHERE pc_id = ?`,
            [pcId]
        );

        if (affectedRows === 0) {
            // Use a more specific error message
            return NextResponse.json({ error: 'Server (pc) not found or already deleted' }, { status: 404 });
        }
        
        // Success response
        return NextResponse.json({ success: true, message: `Server (pc) with ID ${pcId} deleted successfully.` });

    } catch (error: unknown) {
        console.error(`Error deleting server (pc) ${pcId}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        // Basic error handling, could be expanded (e.g., check for specific DB errors)
        return NextResponse.json(
            { error: 'Failed to delete server (pc)', details: message },
            { status: 500 }
        );
    }
} 