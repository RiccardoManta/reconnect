import { NextRequest, NextResponse } from 'next/server';
// Import the new dbUtils - adjust path if necessary
import * as dbUtils from '@/db/dbUtils'; 
import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

// UPDATE Interface for the expected shape of POST/PUT request body
// To match the ServerData interface used in the frontend modal
interface ServerRequestBody {
    casual_name: string; // was name
    platform?: string; // Frontend sends platform name
    bench_type?: string; // remains bench_type
    pc_info_text?: string; // was description
    status?: string; // was specific enum, now string to match pc_overview.status
    user_name?: string; // was user
    // We might need bench_id if associating with an existing bench, but POST implies new
}

// Interface for the expected shape of server data returned by GET/POST/PUT
interface ServerApiResponse extends RowDataPacket {
  dbId: number;
  casual_name: string | null;
  platform: string | null; // Still return platform name
  bench_type: string | null;
  pc_info_text: string | null;
  status: string | null;
  user_name: string | null;
}


// GET method to fetch all servers with joined data
export async function GET(): Promise<NextResponse> {
  try {
    // UPDATE the SQL query to join with platforms table
    const servers = await dbUtils.query<ServerApiResponse[]>(`
      SELECT 
        p.pc_id AS dbId,          
        p.casual_name,
        plat.platform_name AS platform, -- Get name from platforms table
        t.bench_type,
        p.pc_info_text,
        p.status,
        p.active_user AS user_name
      FROM pc_overview p
      LEFT JOIN test_benches t ON p.bench_id = t.bench_id
      LEFT JOIN test_bench_project_overview o ON t.bench_id = o.bench_id
      LEFT JOIN platforms plat ON o.platform_id = plat.platform_id -- Join with platforms
      WHERE p.casual_name IS NOT NULL AND p.casual_name <> '' 
      ORDER BY p.pc_id
    `);
    
    return NextResponse.json({ servers });

  } catch (error: unknown) {
    console.error('Error fetching server data:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch server data', details: message },
      { status: 500 }
    );
  }
}

// Helper function to get or create platform_id
async function getOrCreatePlatformId(connection: PoolConnection, platformName: string | undefined): Promise<number | bigint | null> {
  if (!platformName || platformName.trim() === '') {
    return null; // Or handle as 'Uncategorized' if desired
  }
  
  // Check if platform exists
  const [existingPlatform] = await connection.query<RowDataPacket[]>(
      'SELECT platform_id FROM platforms WHERE platform_name = ?',
      [platformName]
  );
  
  if (existingPlatform.length > 0) {
    return existingPlatform[0].platform_id;
  }

  // Platform doesn't exist, insert it
  const [newPlatformResult] = await connection.query<ResultSetHeader>(
      'INSERT INTO platforms (platform_name) VALUES (?)',
      [platformName]
  );

  if (!newPlatformResult.insertId) {
      throw new Error('Failed to insert new platform');
  }
  return newPlatformResult.insertId;
}

// POST method to add a new server
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: ServerRequestBody = await request.json();
    
    if (!body.casual_name || !body.platform || !body.pc_info_text) {
      return NextResponse.json(
        { error: 'Casual Name, Platform, and PC Info Text are required' },
        { status: 400 }
      );
    }

    let newServer: ServerApiResponse | null = null;

    const pcId: number | bigint = await dbUtils.transaction(async (connection: PoolConnection) => {
      
      // Get or create platform_id using the helper function
      const platformId = await getOrCreatePlatformId(connection, body.platform);
      if (platformId === null) throw new Error('Platform name is invalid or could not be processed.');
      
      // 1. Insert into test_benches
      const [testBenchResult] = await connection.query<ResultSetHeader>(
        `INSERT INTO test_benches (hil_name, bench_type, system_type, user_id) VALUES (?, ?, ?, ?)`, 
        [body.casual_name, body.bench_type || null, body.bench_type || null, null]
      );
      const currentBenchId = testBenchResult.insertId;
      if (!currentBenchId) throw new Error("Failed to get bench_id after insert into test_benches");
      
      // 2. Insert into test_bench_project_overview (using platformId)
      await connection.query(
        `INSERT INTO test_bench_project_overview (bench_id, platform_id) VALUES (?, ?)`, 
        [currentBenchId, platformId] // Use platformId here
      );
      
      // 3. Insert into pc_overview
      const [pcOverviewResult] = await connection.query<ResultSetHeader>(
        `INSERT INTO pc_overview (bench_id, pc_name, casual_name, pc_info_text, status, active_user) VALUES (?, ?, ?, ?, ?, ?)`, 
        [currentBenchId, body.casual_name || null, body.casual_name || null, body.pc_info_text || null, body.status || 'online', body.user_name || null]
      );
      const currentPcId = pcOverviewResult.insertId;
      if (!currentPcId) throw new Error("Failed to get pc_id after insert into pc_overview");

      return currentPcId;
    });

    // Fetch the newly created server data (join with platforms)
    if (pcId) {
        newServer = await dbUtils.queryOne<ServerApiResponse>(
            `SELECT 
              p.pc_id AS dbId,
              p.casual_name,
              plat.platform_name AS platform, -- Select platform name
              t.bench_type,
              p.pc_info_text,
              p.status,
              p.active_user AS user_name
            FROM pc_overview p
            LEFT JOIN test_benches t ON p.bench_id = t.bench_id
            LEFT JOIN test_bench_project_overview o ON t.bench_id = o.bench_id
            LEFT JOIN platforms plat ON o.platform_id = plat.platform_id -- Join platforms
            WHERE p.pc_id = ?`, 
            [pcId]
        );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Server added successfully',
      server: newServer
    });
      
  } catch (error: unknown) {
    console.error('Error adding server:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to add server', details: message },
      { status: 500 }
    );
  }
}

// PUT method to update an existing server
export async function PUT(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  // UPDATE: Assume ID is pc_id now based on GET/POST structure
  const pcIdStr = searchParams.get('id');

  if (!pcIdStr) {
    return NextResponse.json({ error: 'PC ID (dbId) is required for update' }, { status: 400 });
  }

  const pcId = parseInt(pcIdStr, 10);
  if (isNaN(pcId)) {
    return NextResponse.json({ error: 'Invalid PC ID format' }, { status: 400 });
  }

  try {
    const body: ServerRequestBody = await request.json();
    
    if (!body.casual_name || !body.platform || !body.pc_info_text) {
      return NextResponse.json({ error: 'Name, Platform, and Info fields are required for update' }, { status: 400 });
    }

    let updatedServer: ServerApiResponse | null = null;

    await dbUtils.transaction(async (connection: PoolConnection) => {
      // Check if the pc exists and get its associated bench_id
      const [pcData] = await connection.query<RowDataPacket[]>(
          'SELECT bench_id FROM pc_overview WHERE pc_id = ?',
          [pcId]
      );
      if (pcData.length === 0 || !pcData[0].bench_id) {
           throw new Error('Server (PC or associated Bench) not found');
      }
      const benchId = pcData[0].bench_id;

      // Get or create platform_id using the helper function
      const platformId = await getOrCreatePlatformId(connection, body.platform);
      if (platformId === null) throw new Error('Platform name is invalid or could not be processed.');

      // 1. Update test_benches table (using benchId)
      await connection.query(
        `UPDATE test_benches SET hil_name = ?, bench_type = ?, system_type = ? WHERE bench_id = ?`, 
        [body.casual_name, body.bench_type || null, body.bench_type || null, benchId]
      );
      
      // 2. Update or Insert test_bench_project_overview table (using benchId and platformId)
      await connection.query(
          `INSERT INTO test_bench_project_overview (bench_id, platform_id) VALUES (?, ?) 
           ON DUPLICATE KEY UPDATE platform_id = VALUES(platform_id)`, 
          [benchId, platformId] // Use platformId
      );
     
      // 3. Update pc_overview table (using pcId)
      await connection.query(
          `UPDATE pc_overview 
           SET pc_name = ?, casual_name = ?, pc_info_text = ?, status = ?, active_user = ?
           WHERE pc_id = ?`, 
          [body.casual_name || null, body.casual_name || null, body.pc_info_text || null, body.status || 'online', body.user_name || null, pcId]
      );
    });

    // Fetch the updated server data (join with platforms)
    updatedServer = await dbUtils.queryOne<ServerApiResponse>(
        `SELECT 
          p.pc_id AS dbId,
          p.casual_name,
          plat.platform_name AS platform, -- Select platform name
          t.bench_type,
          p.pc_info_text,
          p.status,
          p.active_user AS user_name
        FROM pc_overview p
        LEFT JOIN test_benches t ON p.bench_id = t.bench_id
        LEFT JOIN test_bench_project_overview o ON t.bench_id = o.bench_id
        LEFT JOIN platforms plat ON o.platform_id = plat.platform_id -- Join platforms
        WHERE p.pc_id = ?`,
        [pcId]
    );

    if (!updatedServer) {
        return NextResponse.json({ error: 'Failed to retrieve updated server data' }, { status: 404 });
    }
      
    return NextResponse.json({ 
      success: true, 
      message: 'Server updated successfully',
      server: updatedServer
    });
      
  } catch (error: unknown) {
    console.error('Error updating server:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update server', details: message },
      { status: 500 }
    );
  }
}

// DELETE method to remove a server and related data
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  // Assuming ID refers to pc_id based on previous changes
  const pcIdStr = searchParams.get('id'); 

  if (!pcIdStr) {
    return NextResponse.json({ error: 'PC ID (dbId) is required for deletion' }, { status: 400 });
  }
  const pcId = parseInt(pcIdStr, 10);
  if (isNaN(pcId)) {
    return NextResponse.json({ error: 'Invalid PC ID format' }, { status: 400 });
  }

  try {
      let benchIdToDelete: number | null = null;

      // Use a transaction to ensure atomicity
      await dbUtils.transaction(async (connection: PoolConnection) => {
          // Find the associated bench_id from pc_id
          const [pcData] = await connection.query<RowDataPacket[]>(
              'SELECT bench_id FROM pc_overview WHERE pc_id = ?',
              [pcId]
          );
          if (pcData.length === 0 || !pcData[0].bench_id) {
              // PC might not exist, or might not be linked to a bench. 
              // Decide if deleting just the PC is acceptable or if it should error.
              // For now, let's try deleting the PC row directly if no bench is found or if bench_id is null.
              const [pcDeleteResult] = await connection.query<ResultSetHeader>(
                  'DELETE FROM pc_overview WHERE pc_id = ?',
                  [pcId]
              );
              if (pcDeleteResult.affectedRows === 0) {
                 throw new Error('Server (PC) not found');
              } 
              // If we successfully deleted the PC row without a bench, we are done with the transaction part.
              benchIdToDelete = null; 
          } else {
              benchIdToDelete = pcData[0].bench_id;
          }

          // If we found a bench_id, proceed to delete the bench (which should cascade)
          if (benchIdToDelete !== null) {
              // The CASCADE constraints should handle deleting related rows in:
              // - test_bench_project_overview
              // - hil_technology
              // - hil_operation
              // - hardware_installation
              // - pc_overview (if linked)
              const [benchDeleteResult] = await connection.query<ResultSetHeader>(
                  'DELETE FROM test_benches WHERE bench_id = ?',
                  [benchIdToDelete]
              );
              
              // Check if the bench was actually deleted (it might have been deleted already)
              if (benchDeleteResult.affectedRows === 0) {
                   // If bench delete had no effect, maybe the PC was linked but bench didn't exist?
                   // Still try deleting the PC row itself just in case.
                   const [pcDeleteResult] = await connection.query<ResultSetHeader>(
                      'DELETE FROM pc_overview WHERE pc_id = ?',
                      [pcId]
                   );
                   if (pcDeleteResult.affectedRows === 0) {
                      // Only throw error if neither bench nor pc was deleted.
                      throw new Error('Server (Bench/PC) not found or already deleted');
                   }
              }
          }
      }); // Transaction commits here if no errors

      return NextResponse.json({ 
          success: true, 
          message: `Server with PC ID ${pcId}${benchIdToDelete ? ` (and Bench ID ${benchIdToDelete})` : ''} deleted successfully` 
      });

  } catch (error: unknown) {
      console.error('Error deleting server:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json(
        { error: 'Failed to delete server', details: message },
        { status: 500 }
      );
  }
} 