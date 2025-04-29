import { NextRequest, NextResponse } from 'next/server';
// Import the new dbUtils - adjust path if necessary
import * as dbUtils from '@/db/dbUtils'; 
import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
// Added imports for session, auth options, and permission utilities
import { getServerSession } from "next-auth/next";
// Corrected path for authOptions
import { authOptions } from "../../../lib/authOptions";
import { getUserPermissions, type UserPermissionContext } from '../../../utils/server/permissionUtils'; // CORRECTED PATH
import { transaction, queryOne, query, update, insert } from '../../../db/dbUtils'; // Ensure dbUtils path is correct

// Interface for the data returned by the GET request (matching frontend ServerCard structure)
interface ServerInfoResult extends RowDataPacket {
  pcId: number;             // From pc_overview.pc_id
  hilName: string | null;    // ADDED: From test_benches.hil_name
  casualName: string | null; // From pc_overview.casual_name
  platformName: string | null; // From platforms.platform_name
  benchType: string | null;   // From test_benches.bench_type
  pcInfoText: string | null;  // From pc_overview.pc_info_text
  status: string | null;      // From pc_overview.status
  activeUser: string | null;  // From pc_overview.active_user
  platformId: number | null; // from test_bench_project_overview.platform_id (for filtering)
}

// Interface for platform ID query needed for PUT/DELETE checks (based on pc_id)
interface PcPlatformResult extends RowDataPacket {
  platform_id: number | null;
}

// --- Interface for PUT Payload --- 
// Reflects data sent from AddServerModal's internal state
interface UpdatePcPayload {
    casual_name: string;
    platform: string; // Platform NAME is sent
    bench_type?: string | null;
    pc_info_text?: string | null;
    // status is handled implicitly based on user_name presence now
    user_name?: string | null; 
}

// Define an interface for the PC ID result that extends RowDataPacket
interface PcIdResult extends RowDataPacket {
  pc_id: number;
}

// Interface for the POST request body (matches AddServerModal data)
interface AddServerPayload {
    hil_name: string;
    casual_name: string;
    platform: string; // Platform NAME is sent
    bench_type?: string | null;
    pc_info_text?: string | null;
    user_name?: string | null; 
}

// GET method to fetch all servers with joined data
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    console.error('[API][GET][/api/servers] Unauthorized: No session or user ID.');
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userIdString = session.user.id;
  const userId = parseInt(userIdString, 10); 
  if (isNaN(userId)) { 
    console.error('[API][GET][/api/servers] Invalid userId format:', userIdString);
    return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
  }

  console.log(`[API][GET][/api/servers] Fetching server info for user ID: ${userId}`);

  try {
    console.log(`[API][GET][/api/servers] Getting permissions for user ${userId}...`);
    const permissions: UserPermissionContext = await getUserPermissions(userId);
    console.log(`[API][GET][/api/servers] Permissions received for user ${userId}:`, JSON.stringify(permissions));

    let servers: ServerInfoResult[];
    const baseQuery = `
        SELECT
            pc.pc_id AS pcId, 
            tb.hil_name AS hilName,
            pc.casual_name AS casualName,
            p.platform_name AS platformName,
            tb.bench_type AS benchType,
            pc.pc_info_text AS pcInfoText,
            pc.status AS status,
            pc.active_user AS activeUser,
            tbo.platform_id AS platformId
        FROM pc_overview pc
        LEFT JOIN test_benches tb ON pc.bench_id = tb.bench_id
        LEFT JOIN test_bench_project_overview tbo ON tb.bench_id = tbo.bench_id
        LEFT JOIN platforms p ON tbo.platform_id = p.platform_id
    `;

    // Admins see all servers (PCs)
    if (permissions.permissionName === 'Admin') {
      console.log(`[API][GET][/api/servers] User ${userId} is Admin. Fetching all PC overview data...`);
      servers = await dbUtils.query<ServerInfoResult[]>(`${baseQuery} ORDER BY pc.pc_id`);
      console.log(`[API][GET][/api/servers] Admin query completed. Found ${servers?.length ?? 0} PCs.`);
    } 
    // Users with other permissions see servers only for their allowed platforms
    else if (permissions.accessiblePlatformIds.length > 0) {
      console.log(`[API][GET][/api/servers] User ${userId} is not Admin. Fetching PCs for platforms: ${permissions.accessiblePlatformIds.join(',')}...`);
      const placeholders = permissions.accessiblePlatformIds.map(() => '?').join(',');
      servers = await dbUtils.query<ServerInfoResult[]>(
        `${baseQuery} WHERE tbo.platform_id IN (${placeholders}) ORDER BY pc.pc_id`,
        permissions.accessiblePlatformIds
      );
      console.log(`[API][GET][/api/servers] Non-admin query completed. Found ${servers?.length ?? 0} PCs.`);
    } else {
      console.log(`[API][GET][/api/servers] User ${userId} has no accessible platforms.`);
      // User has no assigned platforms
      servers = [];
    }

    console.log(`[API][GET][/api/servers] Returning ${servers?.length ?? 0} server info items successfully for user ${userId}.`);
    // Return the data structure expected by the frontend (ServerCard)
    return NextResponse.json(servers); 
  } catch (error: any) {
    // Log the specific error that occurred
    console.error(`[API][GET][/api/servers] !! ERROR !! fetching server info for user ${userId}:`, error); 
    // Ensure the frontend gets a consistent error message
    return NextResponse.json(
      { message: 'Failed to fetch server data', error: error.message }, 
      { status: 500 }
    );
  }
}

// Helper function to get or create platform_id
async function getOrCreatePlatformId(connection: PoolConnection, platformName: string | undefined): Promise<number | null> {
  if (!platformName || platformName.trim() === '') {
    console.warn("[POST][getOrCreatePlatformId] Received empty or undefined platformName.");
    return null; 
  }
  
  const [existingPlatform] = await connection.query<RowDataPacket[] & { platform_id: number }[]>(
      'SELECT platform_id FROM platforms WHERE platform_name = ?',
      [platformName]
  );
  
  if (existingPlatform.length > 0) {
    return existingPlatform[0].platform_id;
  }

  console.log(`[POST][getOrCreatePlatformId] Platform '${platformName}' not found, creating...`);
  const [newPlatformResult] = await connection.query<ResultSetHeader>(
      'INSERT INTO platforms (platform_name) VALUES (?) ON DUPLICATE KEY UPDATE platform_name = VALUES(platform_name)', 
      [platformName]
  );

  if (newPlatformResult.insertId === 0 && newPlatformResult.affectedRows > 0) {
      const [updatedPlatform] = await connection.query<RowDataPacket[] & { platform_id: number }[]>(
         'SELECT platform_id FROM platforms WHERE platform_name = ?',
         [platformName]
       );
      if (updatedPlatform.length > 0) {
           console.log(`[POST][getOrCreatePlatformId] Platform '${platformName}' existed or was created concurrently. Using ID: ${updatedPlatform[0].platform_id}`);
           return updatedPlatform[0].platform_id;
      }
  }

  if (!newPlatformResult.insertId) {
      throw new Error(`[POST][getOrCreatePlatformId] Failed to insert or find new platform '${platformName}'`);
  }
  console.log(`[POST][getOrCreatePlatformId] Platform '${platformName}' created with ID: ${newPlatformResult.insertId}`);
  return newPlatformResult.insertId;
}

// POST method to add a new server
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userIdString = session.user.id;
  const userId = parseInt(userIdString, 10); 
  if (isNaN(userId)) {
    console.error('[API][POST][/api/servers] Invalid userId format:', userIdString);
    return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
  }

  let payload: AddServerPayload;
  try {
    payload = await request.json();
     // Updated validation
    if (!payload.hil_name || !payload.casual_name || !payload.platform || !payload.pc_info_text) { 
      return NextResponse.json({ message: 'Missing required fields: hil_name, casual_name, platform, pc_info_text' }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ message: 'Invalid JSON payload' }, { status: 400 });
  }

  console.log(`[API][POST][/api/servers] User ${userId} attempting to add server:`, JSON.stringify(payload));

  try {
    // --- Permission Check (Role: Admin or Edit) --- 
    const permissions: UserPermissionContext = await getUserPermissions(userId);
    console.log(`[API][POST][/api/servers] User ${userId} has permission: ${permissions.permissionName}`);
    
    if (permissions.permissionName !== 'Admin' && permissions.permissionName !== 'Edit') {
        console.warn(`[API][POST][/api/servers] User ${userId} (Permission: ${permissions.permissionName}) is Forbidden.`);
        return NextResponse.json({ message: 'Forbidden: Requires Edit or Admin permission to add servers.' }, { status: 403 });
    }
    console.log(`[API][POST][/api/servers] User ${userId} has sufficient role permission (${permissions.permissionName}).`);
    // --- End Role Check --- 

    // --- Database Insertion within Transaction --- 
    const newServerData = await dbUtils.transaction(async (connection: PoolConnection) => {
      console.log(`[POST Transaction /api/servers] Started for user ${userId}`);

      // 1. Resolve Platform ID & Check Platform Access
      const targetPlatformId = await getOrCreatePlatformId(connection, payload.platform);
      console.log(`[POST Transaction /api/servers] Resolved target platform '${payload.platform}' to ID: ${targetPlatformId}`);
      if (targetPlatformId === null && payload.platform && payload.platform.trim() !== '') {
          throw new Error(`Invalid target platform name provided: ${payload.platform}`);
      }

      if (permissions.permissionName !== 'Admin') {
         if (targetPlatformId === null || !permissions.accessiblePlatformIds.includes(Number(targetPlatformId))) {
             console.warn(`[POST Transaction /api/servers] User ${userId} forbidden: Cannot add server to target platform ${targetPlatformId}`);
             throw new Error('Forbidden: User cannot add servers to the target platform');
         }
         console.log(`[POST Transaction /api/servers] Platform access check passed for user ${userId}.`);
      } else {
         console.log(`[POST Transaction /api/servers] Skipping platform access check for Admin user ${userId}.`);
      }

      // 2. Create Test Bench entry - Use hil_name now
      const benchInsertSql = `INSERT INTO test_benches (hil_name, bench_type) VALUES (?, ?)`;
      const benchInsertParams = [payload.hil_name, payload.bench_type || null];
      console.log(`[POST Transaction /api/servers] Inserting into test_benches...`, benchInsertParams);
      const [benchResult] = await connection.query<ResultSetHeader>(benchInsertSql, benchInsertParams);
      const newBenchId = benchResult.insertId;
      if (!newBenchId) { throw new Error('Failed to insert into test_benches'); }
      console.log(`[POST Transaction /api/servers] Created test_bench with ID: ${newBenchId}`);

      // 3. Create PC Overview entry
      const initialStatus = payload.user_name && payload.user_name.trim() !== '' ? 'in_use' : 'online';
      const pcInsertSql = `INSERT INTO pc_overview (bench_id, pc_name, casual_name, pc_info_text, status, active_user) VALUES (?, ?, ?, ?, ?, ?)`;
      const pcInsertParams = [newBenchId, payload.casual_name, payload.casual_name, payload.pc_info_text || null, initialStatus, payload.user_name || null];
      console.log(`[POST Transaction /api/servers] Inserting into pc_overview...`, pcInsertParams);
      const [pcResult] = await connection.query<ResultSetHeader>(pcInsertSql, pcInsertParams);
      const newPcId = pcResult.insertId;
      if (!newPcId) { throw new Error('Failed to insert into pc_overview'); }
      console.log(`[POST Transaction /api/servers] Created pc_overview with ID: ${newPcId}`);

      // 4. Create Test Bench Project Overview entry (link bench and platform)
      if (targetPlatformId !== null) {
          const overviewInsertSql = `INSERT INTO test_bench_project_overview (bench_id, platform_id) VALUES (?, ?)`;
          const overviewInsertParams = [newBenchId, targetPlatformId];
          console.log(`[POST Transaction /api/servers] Inserting into test_bench_project_overview...`, overviewInsertParams);
          const [overviewResult] = await connection.query<ResultSetHeader>(overviewInsertSql, overviewInsertParams);
          if (!overviewResult.insertId) { throw new Error('Failed to insert into test_bench_project_overview'); }
          console.log(`[POST Transaction /api/servers] Created test_bench_project_overview association.`);
      } else {
          console.log(`[POST Transaction /api/servers] Skipping test_bench_project_overview insertion as target platform is null.`);
      }

      console.log(`[POST Transaction /api/servers] All insertions successful for new PC ID: ${newPcId}.`);
      // Return the ID of the newly created PC
      return { newPcId };
    }); // End transaction

    // --- Fetch and Return Newly Created Server --- 
    if (!newServerData || !newServerData.newPcId) {
        throw new Error('Transaction completed but did not return the new PC ID.');
    }
    const newPcId = newServerData.newPcId;
    console.log(`[API][POST][/api/servers] Fetching newly created server data for pcId ${newPcId}...`);

    // Use the same query structure as GET to return consistent data
    const finalNewServer = await dbUtils.queryOne<ServerInfoResult>(
         `SELECT 
            pc.pc_id AS pcId, pc.casual_name AS casualName, p.platform_name AS platformName,
            tb.bench_type AS benchType, pc.pc_info_text AS pcInfoText,
            pc.status AS status, pc.active_user AS activeUser, tbo.platform_id AS platformId
          FROM pc_overview pc
          LEFT JOIN test_benches tb ON pc.bench_id = tb.bench_id
          LEFT JOIN test_bench_project_overview tbo ON tb.bench_id = tbo.bench_id
          LEFT JOIN platforms p ON tbo.platform_id = p.platform_id
          WHERE pc.pc_id = ?`,
        [newPcId]
    );

    if (!finalNewServer) {
        console.error(`[API][POST][/api/servers] !! CRITICAL !! Failed to fetch server data immediately after creation for pcId ${newPcId}.`);
        // Return success but maybe indicate data fetch issue?
        // Or return 500 as something is wrong if we can't fetch it.
        return NextResponse.json({ message: 'Server created but failed to fetch confirmation data.' }, { status: 500 });
    }

    console.log(`[API][POST][/api/servers] Successfully created and fetched server ${newPcId}.`);
    return NextResponse.json(finalNewServer, { status: 201 }); // 201 Created status

  } catch (error: any) {
    console.error(`[API][POST][/api/servers] Error creating server for user ${userId}:`, error);
     // Handle specific errors
    if (error.message?.startsWith('Forbidden:')) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
     if (error.message?.startsWith('Invalid target platform name provided:')) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
     if (error.message?.includes('[getOrCreatePlatformId] Failed') || error.message?.includes('Failed to insert')) {
         return NextResponse.json({ message: 'Database error during server creation.', details: error.message }, { status: 500 });
     }
    // Generic error
    return NextResponse.json(
      { message: 'Failed to create server', error: error.message },
      { status: 500 }
    );
  }
}

// PUT method to update an existing server
export async function PUT(request: NextRequest, context: any): Promise<NextResponse> { // Using context: any workaround
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

  // Get pcId from route context
  const pcIdString = (context?.params?.id as string) || ''; // CORRECTED: Use 'id' from route '[id]'
  const pcId = parseInt(pcIdString, 10);
  if (isNaN(pcId)) {
      // If pcId is not in context, maybe it's expected in the payload?
      // Re-checking payload approach based on AddServerModal structure
      // AddServerModal PUTs to /api/servers/[dbId]
      // Let's assume dbId is pcId for now and try to get it from context again.
      // If this fails, we need to rethink the API route or how pcId is passed.
       console.error(`[API][PUT][/api/servers] Failed to parse pcId from context using 'id': ${pcIdString}. Route should be /api/servers/[id]`); // Corrected log
       return NextResponse.json({ error: 'Invalid or missing ID in URL path.' }, { status: 400 }); // Corrected message
  }

  let payload: UpdatePcPayload;
  try {
    payload = await request.json();
  } catch (e) {
    return NextResponse.json({ message: 'Invalid JSON payload' }, { status: 400 });
  }

  // --- Payload Validation ---
  if (!payload.casual_name || !payload.platform || payload.pc_info_text === undefined) { // Check essential fields
    return NextResponse.json({ message: 'Missing required fields: casual_name, platform, pc_info_text' }, { status: 400 });
  }

  console.log(`[API][PUT][/api/servers] User ${userId} attempting to update PC ${pcId}`);

  try {
    // Use a transaction for all checks and updates
    const updatedPcData = await dbUtils.transaction(async (connection) => {
        console.log(`[API][PUT][/api/servers] Transaction started for PC ${pcId}`);
        
        // --- Fetch Current Data and Permissions --- 
        const permissions: UserPermissionContext = await getUserPermissions(userId); 

        // Fetch current bench_id and platform_id for the PC
        // Define a specific type for this query result
        interface CurrentPcInfoResult extends RowDataPacket {
            bench_id: number | null;
            platform_id: number | null;
        }
        const [currentPcInfoRows] = await connection.query<CurrentPcInfoResult[]>(
            `SELECT pc.bench_id, tbo.platform_id 
             FROM pc_overview pc 
             LEFT JOIN test_benches tb ON pc.bench_id = tb.bench_id 
             LEFT JOIN test_bench_project_overview tbo ON tb.bench_id = tbo.bench_id 
             WHERE pc.pc_id = ?`,
            [pcId]
        );

        // Check if PC exists by checking if the query returned any rows
        if (currentPcInfoRows.length === 0) {
            throw new Error('PC not found'); // Throw inside transaction to trigger rollback
        }
        const currentPcInfo = currentPcInfoRows[0]; // Now safe to access the first row

        const currentBenchId = currentPcInfo.bench_id; // Access properties from the row object
        const currentPlatformId = currentPcInfo.platform_id; 
        console.log(`[API][PUT][/api/servers] Current info for PC ${pcId}: benchId=${currentBenchId}, platformId=${currentPlatformId}`);

        // Resolve target platform ID from payload name
        const targetPlatformId = await getOrCreatePlatformId(connection, payload.platform);
        if (targetPlatformId === null && payload.platform) { 
            throw new Error(`Invalid target platform name: ${payload.platform}`);
        }
        console.log(`[API][PUT][/api/servers] Target platform for PC ${pcId}: platformId=${targetPlatformId} (from name: ${payload.platform})`);

        // --- Permission Check --- 
        const canAccessCurrent = permissions.permissionName === 'Admin' || (currentPlatformId !== null && permissions.accessiblePlatformIds.includes(currentPlatformId));
        const canAccessTarget = permissions.permissionName === 'Admin' || (targetPlatformId !== null && permissions.accessiblePlatformIds.includes(Number(targetPlatformId)));
        if (!canAccessCurrent) {
            throw new Error('Forbidden: User cannot modify servers on the current platform');
        }
        if (!canAccessTarget) {
            throw new Error('Forbidden: User cannot assign servers to the target platform');
        }
        console.log(`[API][PUT][/api/servers] User ${userId} permission checks passed for PC ${pcId}.`);

        // --- Database Updates --- 
        
        // 1. Update pc_overview 
        const newStatus = payload.user_name && payload.user_name.trim() !== '' ? 'in_use' : 'online'; 
        console.log(`[API][PUT][/api/servers] Updating pc_overview for PC ${pcId}...`);
        await connection.query(
            `UPDATE pc_overview SET casual_name = ?, pc_info_text = ?, active_user = ?, status = ? WHERE pc_id = ?`,
            [payload.casual_name, payload.pc_info_text ?? null, payload.user_name?.trim() || null, newStatus, pcId]
        );

        // 2. Update test_benches 
        if (currentBenchId !== null) {
             console.log(`[API][PUT][/api/servers] Updating test_benches for Bench ${currentBenchId}...`);
            await connection.query(`UPDATE test_benches SET bench_type = ? WHERE bench_id = ?`, [payload.bench_type ?? null, currentBenchId]);
        } else {
            console.log(`[API][PUT][/api/servers] Skipping test_benches update for PC ${pcId} as bench_id is null.`);
        }

        // 3. Update/Insert platform assignment
        if (currentBenchId !== null && targetPlatformId !== null) {
             console.log(`[API][PUT][/api/servers] Updating test_bench_project_overview for Bench ${currentBenchId} to Platform ${targetPlatformId}...`);
            await connection.query(`INSERT INTO test_bench_project_overview (bench_id, platform_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE platform_id = VALUES(platform_id)`, [currentBenchId, targetPlatformId]);
        } else if (currentBenchId === null) {
             console.log(`[API][PUT][/api/servers] Skipping test_bench_project_overview update for PC ${pcId} as bench_id is null.`);
        } else if (targetPlatformId === null) {
             console.log(`[API][PUT][/api/servers] Skipping test_bench_project_overview update for PC ${pcId} as targetPlatformId is null.`);
             // Optional: Delete existing assignment if target is null/empty?
             // await connection.query('DELETE FROM test_bench_project_overview WHERE bench_id = ?', [currentBenchId]);
        }

        console.log(`[API][PUT][/api/servers] Updates successful for PC ${pcId} within transaction.`);
        
        // Fetch and return the updated data structure matching GET response
        const [finalDataRows] = await connection.query<ServerInfoResult[]>(
             `SELECT
                pc.pc_id AS pcId, pc.casual_name AS casualName, p.platform_name AS platformName,
                tb.bench_type AS benchType, pc.pc_info_text AS pcInfoText,
                pc.status AS status, pc.active_user AS activeUser, tbo.platform_id AS platformId
              FROM pc_overview pc
              LEFT JOIN test_benches tb ON pc.bench_id = tb.bench_id
              LEFT JOIN test_bench_project_overview tbo ON tb.bench_id = tbo.bench_id
              LEFT JOIN platforms p ON tbo.platform_id = p.platform_id
              WHERE pc.pc_id = ?`,
            [pcId]
        );
        if (finalDataRows.length === 0) {
             // This shouldn't happen if the initial check passed and updates succeeded
             throw new Error ('Failed to retrieve updated PC data after update.');
        }
        return finalDataRows[0]; // Return the first (and only) row

    }); // End transaction

    // Transaction successful, return the updated data
    if (!updatedPcData) {
         throw new Error('Transaction completed but failed to return updated PC data.');
    }
    console.log(`[API][PUT][/api/servers] Successfully updated PC ${pcId}. Returning data.`);
    return NextResponse.json(updatedPcData); 

  } catch (error: any) {
    console.error(`[API][PUT][/api/servers] Error updating PC ${pcId}:`, error);
    // Handle specific errors thrown from transaction
    if (error.message === 'PC not found') {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error.message?.startsWith('Forbidden:')) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
     if (error.message?.startsWith('Invalid target platform name:')) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
     if (error.message?.includes('Failed to insert new platform')) {
         return NextResponse.json({ message: 'Failed to create specified platform during update.', details: error.message }, { status: 500 });
     }

    // Generic server error for other issues
    return NextResponse.json(
      { message: 'Failed to update PC', error: error.message },
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
    
    // Fetch the PC to check existence using the new interface
    const pcToDelete = await dbUtils.queryOne<PcIdResult>(
        `SELECT pc_id FROM pc_overview WHERE pc_id = ?`,
        [pcId]
    );

    // Check if PC exists 
    if (!pcToDelete) {
        return NextResponse.json({ message: 'PC not found' }, { status: 404 }); 
    }
    
    // Permission Check: ONLY Admins can delete.
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
      // Delete the PC overview entry
      const affectedRows = await dbUtils.update(
        'DELETE FROM pc_overview WHERE pc_id = ?',
        [pcId]
      );
      console.log(
        `[API][DELETE][/api/servers] Deletion result for PC ${pcId}: affectedRows= ${affectedRows}`
      );
      if (affectedRows === 0) {
        throw new Error(`PC deletion failed unexpectedly within transaction (0 rows affected)`); 
      }
      return { affectedRows: affectedRows };
    }); 

    // Transaction successful
    console.log(
      `[API][DELETE][/api/servers] PC ${pcId} deleted successfully by Admin User ${userId}.`
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