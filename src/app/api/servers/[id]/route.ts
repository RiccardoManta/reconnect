import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/authOptions";
import { getUserPermissions, type UserPermissionContext } from '../../../../utils/server/permissionUtils';

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

// Define an interface for the PC ID result used in DELETE
interface PcIdResult extends RowDataPacket {
  pc_id: number;
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

// --- Helper function (adapted from /api/servers/route.ts) ---
// Gets or creates platform_id using the transaction connection
async function getOrCreatePlatformId(connection: PoolConnection, platformName: string | undefined): Promise<number | null> {
  if (!platformName || platformName.trim() === '') {
    console.warn("[getOrCreatePlatformId] Received empty or undefined platformName.");
    return null; 
  }
  
  const [existingPlatform] = await connection.query<RowDataPacket[] & { platform_id: number }[]>(
      'SELECT platform_id FROM platforms WHERE platform_name = ?',
      [platformName]
  );
  
  if (existingPlatform.length > 0) {
    return existingPlatform[0].platform_id;
  }

  console.log(`[getOrCreatePlatformId] Platform '${platformName}' not found, creating...`);
  const [newPlatformResult] = await connection.query<ResultSetHeader>(
      'INSERT INTO platforms (platform_name) VALUES (?) ON DUPLICATE KEY UPDATE platform_name = VALUES(platform_name)', // Added ON DUPLICATE KEY just in case of race conditions
      [platformName]
  );

  if (newPlatformResult.insertId === 0 && newPlatformResult.affectedRows > 0) {
      // This handles the case where ON DUPLICATE KEY UPDATE occurred
      const [updatedPlatform] = await connection.query<RowDataPacket[] & { platform_id: number }[]>(
         'SELECT platform_id FROM platforms WHERE platform_name = ?',
         [platformName]
       );
      if (updatedPlatform.length > 0) {
           console.log(`[getOrCreatePlatformId] Platform '${platformName}' already existed or was created concurrently. Using ID: ${updatedPlatform[0].platform_id}`);
           return updatedPlatform[0].platform_id;
      }
  }

  if (!newPlatformResult.insertId) {
      throw new Error(`[getOrCreatePlatformId] Failed to insert or find new platform '${platformName}'`);
  }
  console.log(`[getOrCreatePlatformId] Platform '${platformName}' created with ID: ${newPlatformResult.insertId}`);
  return newPlatformResult.insertId;
}
// --- End Helper --- 

// IMPLEMENT PUT method to update an existing server by pc_id
export async function PUT(request: NextRequest, context: any): Promise<NextResponse> { 
  // --- Session and User ID Check --- (Assuming getServerSession/authOptions are imported)
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userIdString = session.user.id;
  const userId = parseInt(userIdString, 10); 
  if (isNaN(userId)) {
    console.error('[API][PUT][/api/servers] Invalid userId format:', userIdString);
    return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
  }
  // --- End Session Check ---
  
  const id = context?.params?.id;
  if (typeof id !== 'string') {
      return NextResponse.json({ error: 'Invalid or missing server (pc) ID in params' }, { status: 400 });
  }
  const pcId = parseInt(id, 10);

  if (isNaN(pcId)) {
      return NextResponse.json({ error: 'Invalid server (pc) ID format' }, { status: 400 });
  }

  let permissions: UserPermissionContext; // Define permissions here to be accessible in catch

  try {
    // --- Permission Check (Role Level) ---
    console.log(`[API][PUT][/api/servers/${pcId}] Checking permissions for user ${userId}...`);
    permissions = await getUserPermissions(userId);
    console.log(`[API][PUT][/api/servers/${pcId}] User ${userId} has permission: ${permissions.permissionName}`);
    
    if (permissions.permissionName !== 'Admin' && permissions.permissionName !== 'Edit') {
        console.warn(`[API][PUT][/api/servers/${pcId}] User ${userId} (Permission: ${permissions.permissionName}) is Forbidden.`);
        return NextResponse.json({ message: 'Forbidden: Requires Edit or Admin permission.' }, { status: 403 });
    }
    console.log(`[API][PUT][/api/servers/${pcId}] User ${userId} has sufficient role permission (${permissions.permissionName}). Proceeding...`);
    // --- End Role Check ---

    const body: ServerRequestBody = await request.json();
    // DEBUG: Log incoming body
    console.log(`[PUT /api/servers/${pcId}] Received body:`, JSON.stringify(body, null, 2));
    
    // Validation: Use the correct fields now expected
    if (!body.casual_name || !body.platform || !body.pc_info_text) { 
      return NextResponse.json({ error: 'Casual Name, Platform, and PC Info Text are required for update' }, { status: 400 });
    }

    let updatedServer: ServerApiResponse | null = null;

    // Use dbUtils.transaction
    await dbUtils.transaction(async (connection: PoolConnection) => {
      // Fetch current bench_id and platform_id 
      // Define a specific type for this query result
      interface CurrentPcData extends RowDataPacket {
            bench_id: number | null;
            platform_id: number | null;
            status: string | null;
      }
      console.log(`[PUT Transaction /api/servers/${pcId}] Fetching current bench_id, platform_id, status for pc_id: ${pcId}`);
      const [currentPcRows] = await connection.query<CurrentPcData[]>(
           `SELECT pc.bench_id, tbo.platform_id, pc.status
            FROM pc_overview pc
            LEFT JOIN test_benches tb ON pc.bench_id = tb.bench_id
            LEFT JOIN test_bench_project_overview tbo ON tb.bench_id = tbo.bench_id
            WHERE pc.pc_id = ?`,
            [pcId]
        );
      if (currentPcRows.length === 0) {
           throw new Error('Server (pc) not found'); // Throw inside transaction
      }
      const currentPcData = currentPcRows[0];
      const associatedBenchId = currentPcData.bench_id;
      const currentPlatformId = currentPcData.platform_id;
      const currentDbStatus = currentPcData.status?.toLowerCase();
      console.log(`[PUT Transaction /api/servers/${pcId}] Found: benchId=${associatedBenchId}, currentPlatformId=${currentPlatformId}, currentStatus=${currentDbStatus}`);

      // Resolve target platform ID from payload name using helper
      const targetPlatformId = await getOrCreatePlatformId(connection, body.platform);
      console.log(`[PUT Transaction /api/servers/${pcId}] Resolved target platform '${body.platform}' to ID: ${targetPlatformId}`);
      if (targetPlatformId === null && body.platform && body.platform.trim() !== '') {
          throw new Error(`Invalid target platform name provided: ${body.platform}`); // Fail if resolution fails for non-empty name
      }

      // --- Platform Access Permission Check (within transaction) ---
      if (permissions.permissionName !== 'Admin') {
          console.log(`[PUT Transaction /api/servers/${pcId}] Performing platform access check for non-admin user ${userId}`);
          // Check access to current platform (if it exists)
          const canAccessCurrent = currentPlatformId === null || permissions.accessiblePlatformIds.includes(currentPlatformId);
          if (!canAccessCurrent) {
              console.warn(`[PUT Transaction /api/servers/${pcId}] User ${userId} forbidden: Cannot modify server on current platform ${currentPlatformId}`);
              throw new Error('Forbidden: User cannot modify servers on the current platform');
          }
          // Check access to target platform (if it exists)
          const canAccessTarget = targetPlatformId === null || permissions.accessiblePlatformIds.includes(Number(targetPlatformId));
          if (!canAccessTarget) {
               console.warn(`[PUT Transaction /api/servers/${pcId}] User ${userId} forbidden: Cannot assign server to target platform ${targetPlatformId}`);
              throw new Error('Forbidden: User cannot assign servers to the target platform');
          }
          console.log(`[PUT Transaction /api/servers/${pcId}] Platform access checks passed for user ${userId}.`);
      } else {
          console.log(`[PUT Transaction /api/servers/${pcId}] Skipping platform access check for Admin user ${userId}.`);
      }
      // --- End Platform Access Check ---

      // Determine new status (same logic as before)
      let newStatus: string;
      const hasUser = body.user_name && body.user_name.trim() !== '';
      if (currentDbStatus === 'offline') { newStatus = 'offline'; }
      else if (hasUser) { newStatus = 'in_use'; } 
      else { newStatus = 'online'; }

      // Update pc_overview 
      const pcUpdateSql = `UPDATE pc_overview SET casual_name = ?, pc_info_text = ?, status = ?, active_user = ? WHERE pc_id = ?`;
      const pcUpdateParams = [body.casual_name || null, body.pc_info_text || null, newStatus, body.user_name || null, pcId];
      console.log(`[PUT Transaction /api/servers/${pcId}] Updating pc_overview...`, pcUpdateParams);
      const [pcUpdateResult] = await connection.execute<ResultSetHeader>(pcUpdateSql, pcUpdateParams);
      if (pcUpdateResult.affectedRows === 0) { console.warn(`pc_overview update affected 0 rows`); }

      // Update associated test_benches and test_bench_project_overview if bench_id exists
      if (associatedBenchId) {
          // Update test_benches
          const benchUpdateSql = `UPDATE test_benches SET hil_name = ?, bench_type = ? WHERE bench_id = ?`;
          const benchUpdateParams = [body.casual_name, body.bench_type || null, associatedBenchId];
          console.log(`[PUT Transaction /api/servers/${pcId}] Updating test_benches ${associatedBenchId}...`, benchUpdateParams);
          await connection.execute(benchUpdateSql, benchUpdateParams);
          
          // --- CORRECTED Logic for test_bench_project_overview --- 
          console.log(`[PUT Transaction /api/servers/${pcId}] Checking existing test_bench_project_overview for bench ${associatedBenchId}...`);
          const [existingOverviewRows] = await connection.query<RowDataPacket[] & { overview_id: number }[]>(
             'SELECT overview_id FROM test_bench_project_overview WHERE bench_id = ? LIMIT 1',
             [associatedBenchId]
          );

          if (targetPlatformId !== null) {
            // User wants to associate with a specific platform
            if (existingOverviewRows.length > 0) {
               // Entry exists, UPDATE its platform_id
               const existingOverviewId = existingOverviewRows[0].overview_id;
               console.log(`[PUT Transaction /api/servers/${pcId}] Found existing overview ${existingOverviewId}. Updating platform_id to ${targetPlatformId}.`);
               const overviewUpdateSql = `UPDATE test_bench_project_overview SET platform_id = ? WHERE overview_id = ?`;
               await connection.execute(overviewUpdateSql, [targetPlatformId, existingOverviewId]);
            } else {
               // Entry does NOT exist, INSERT new association
               console.log(`[PUT Transaction /api/servers/${pcId}] No existing overview found. Inserting new association for bench ${associatedBenchId} and platform ${targetPlatformId}.`);
               const overviewInsertSql = `INSERT INTO test_bench_project_overview (bench_id, platform_id) VALUES (?, ?)`;
               await connection.execute(overviewInsertSql, [associatedBenchId, targetPlatformId]);
            }
          } else {
             // User wants to disassociate (targetPlatformId is null/empty platform name)
             if (existingOverviewRows.length > 0) {
                // Entry exists, DELETE it
                const existingOverviewId = existingOverviewRows[0].overview_id;
                console.log(`[PUT Transaction /api/servers/${pcId}] Target platform is null. Deleting existing overview ${existingOverviewId} for bench ${associatedBenchId}.`);
                await connection.execute('DELETE FROM test_bench_project_overview WHERE overview_id = ?', [existingOverviewId]);
             } else {
                // Entry doesn't exist, and target is null, do nothing.
                console.log(`[PUT Transaction /api/servers/${pcId}] Target platform is null and no existing overview found for bench ${associatedBenchId}. Nothing to delete.`);
             }
          }
          // --- End CORRECTED Logic ---

      } else {
          console.log(`[PUT Transaction /api/servers/${pcId}] Skipping bench updates as associatedBenchId is null.`);
      }
      
    }); // End transaction

    // Fetch the updated server data outside the transaction using the standardized query
     updatedServer = await dbUtils.queryOne<ServerApiResponse>(
         `SELECT 
           p.pc_id AS dbId,
           p.casual_name,
           plat.platform_name AS platform, -- Fetch platform name
           t.bench_type,
           p.pc_info_text,
           p.status,
           p.active_user AS user_name
         FROM pc_overview p
         LEFT JOIN test_benches t ON p.bench_id = t.bench_id
         LEFT JOIN test_bench_project_overview o ON t.bench_id = o.bench_id
         LEFT JOIN platforms plat ON o.platform_id = plat.platform_id -- Join platforms table
         WHERE p.pc_id = ?`, 
         [pcId]
     );
    console.log(`[API][PUT][/api/servers/${pcId}] Fetched updated data:`, updatedServer);

    if (!updatedServer) {
        return NextResponse.json({ error: 'Failed to retrieve updated server (pc) data after transaction' }, { status: 500 }); // Use 500 as this shouldn't happen
    }
      
    return NextResponse.json({ 
      success: true, 
      message: 'Server (pc) updated successfully',
      server: updatedServer // Return updated data matching ServerApiResponse
    });
      
  } catch (error: unknown) {
    console.error(`[API][PUT][/api/servers/${pcId}] Error updating server (pc):`, error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    // Handle specific errors like 'Server (pc) not found' or 'Forbidden' from the transaction
    if (message === 'Server (pc) not found') {
        return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message.startsWith('Forbidden:')) {
        return NextResponse.json({ error: message }, { status: 403 }); // Use 'error' key for consistency
    }
     if (message.startsWith('Invalid target platform name provided:')) {
        return NextResponse.json({ error: message }, { status: 400 });
    }
     if (message.startsWith('[getOrCreatePlatformId] Failed')) {
        return NextResponse.json({ error: 'Database error during platform handling.', details: message }, { status: 500 });
     }

    return NextResponse.json(
      { error: 'Failed to update server (pc)', details: message },
      { status: 500 }
    );
  }
}

// DELETE method to remove a server and related data
export async function DELETE(
  req: NextRequest,
  context: any // Apply workaround: Use context: any
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userIdString = session.user.id; // Keep original string for logging if needed
  const userId = parseInt(userIdString, 10); // Parse to number
  if (isNaN(userId)) {
    console.error('[API][DELETE][/api/servers] Invalid userId format after parse:', userIdString);
    return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
  }

  // Get pcId from context using workaround
  const pcIdString = (context?.params?.id as string) || ''; // CORRECTED: Use 'id' from route '[id]'
  const pcId = parseInt(pcIdString, 10);

  if (isNaN(pcId)) {
    console.error(`[API][DELETE][/api/servers] Failed to parse pcId from context using 'id': ${pcIdString}`); // Corrected log
    return NextResponse.json({ message: 'Invalid or missing ID in URL path' }, { status: 400 }); // Corrected message
  }

  console.log(`[API][DELETE][/api/servers] Request received for PC ${pcId} from User ${userId}`);

  try {
    // --- Pre-Checks (Permissions and Existence) --- 
    const permissions: UserPermissionContext = await getUserPermissions(userId); // Pass numeric userId
    
    // !!! --- ADDING DEBUG LOG --- !!!
    // Log the fetched permissions object for the current user.
    console.log(`[API][DELETE][/api/servers] DEBUG: Permissions fetched for User ${userId}:`, JSON.stringify(permissions)); 
    // !!! ----------------------- !!!

    // Fetch the PC to check existence using the new interface
    const pcToDelete = await dbUtils.queryOne<PcIdResult>(
        `SELECT pc_id FROM pc_overview WHERE pc_id = ?`,
        [pcId]
    );

    // Check if PC exists 
    if (!pcToDelete) {
        console.log(`[API][DELETE][/api/servers] PC ${pcId} not found.`);
        return NextResponse.json({ message: 'PC not found' }, { status: 404 }); 
    }
    
    // Permission Check: ONLY Admins can delete.
    // !!! --- ADDING DEBUG LOG --- !!!
    console.log(`[API][DELETE][/api/servers] DEBUG: Checking permission: Is "${permissions.permissionName}" === 'Admin'?`); // Add log before check
    // !!! ----------------------- !!!
    if (permissions.permissionName !== 'Admin') { 
        console.warn(
          `[API][DELETE][/api/servers] User ${userId} (Permission: ${permissions.permissionName}) forbidden to delete PC ${pcId}. Requires Admin.`
        );
        // Return 403 Forbidden if user is not Admin
        return NextResponse.json({ message: 'Forbidden: Requires Admin permission to delete servers.' }, { status: 403 });
    }
    
    // --- Deletion Logic (Admin Only) --- 
    console.log(`[API][DELETE][/api/servers] Admin User ${userId} authorized. Proceeding with deletion for PC ${pcId}...`);
    
    // Use a transaction for the delete operation
    const result = await dbUtils.transaction(async (connection: PoolConnection) => {
      // Find the bench_id associated with the pc_id before deleting
      const benchInfo = await connection.query<RowDataPacket[]>(
        'SELECT bench_id FROM pc_overview WHERE pc_id = ?',
        [pcId]
      );
      const benchIdToDelete = (benchInfo[0].length > 0) ? benchInfo[0][0].bench_id : null;

      // 1. Delete from pc_overview
      const [pcDeleteResult] = await connection.query<ResultSetHeader>(
        'DELETE FROM pc_overview WHERE pc_id = ?',
        [pcId]
      );
      const affectedRows = pcDeleteResult.affectedRows;
      console.log(
        `[API][DELETE][/api/servers] pc_overview deletion for PC ${pcId}: affectedRows= ${affectedRows}`
      );
      if (affectedRows === 0) {
        throw new Error(`PC overview deletion failed unexpectedly (0 rows affected)`); 
      }

      // 2. Delete related entries if bench_id was found
      if (benchIdToDelete !== null) {
        console.log(`[API][DELETE][/api/servers] Found associated bench_id ${benchIdToDelete}. Deleting related entries...`);
        // Delete from test_bench_project_overview
        const [tboDeleteResult] = await connection.query<ResultSetHeader>(
          'DELETE FROM test_bench_project_overview WHERE bench_id = ?',
          [benchIdToDelete]
        );
        console.log(`  - test_bench_project_overview deleted: ${tboDeleteResult.affectedRows} rows`);
        
        // Delete from test_benches
        const [tbDeleteResult] = await connection.query<ResultSetHeader>(
          'DELETE FROM test_benches WHERE bench_id = ?',
          [benchIdToDelete]
        );
        console.log(`  - test_benches deleted: ${tbDeleteResult.affectedRows} rows`);
      } else {
        console.log(`[API][DELETE][/api/servers] No associated bench_id found for PC ${pcId}. Skipping related deletions.`);
      }

      return { affectedRows: affectedRows }; // Return the result from pc_overview deletion
    }); 

    // Transaction successful
    console.log(
      `[API][DELETE][/api/servers] PC ${pcId} and related data deleted successfully by Admin User ${userId}.`
    );
    return NextResponse.json(
      { message: 'PC deleted successfully' }, 
      { status: 200 }
    );

  } catch (error: any) {
    console.error(
      `[API][DELETE][/api/servers] Error deleting PC ${pcId} for user ${userId}:`,
      error
    );
    // Update specific error message check if needed
    if (error.message === 'Forbidden: Requires Admin permission to delete servers.') {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    // Handle specific transaction error
    if (error.message?.includes('PC deletion failed unexpectedly')) {
      return NextResponse.json({ message: 'PC deletion failed during transaction' }, { status: 500 });
    }
    // Handle PC not found error (just in case)
    if (error.message === 'PC not found') { 
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    // Generic server error for other issues
    return NextResponse.json(
      { message: 'Failed to delete PC', error: error.message }, 
      { status: 500 }
    );
  }
} 