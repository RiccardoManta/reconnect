import { NextRequest, NextResponse } from 'next/server';
// Import the new dbUtils - adjust path if necessary
import * as dbUtils from '@/db/dbUtils'; 
import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

// Interface for the expected shape of POST/PUT request body
// Optional fields for PUT are handled by the logic
interface ServerRequestBody {
    name: string;
    platform?: string;
    bench_type?: string;
    description?: string;
    status?: 'online' | 'offline' | 'in_use';
    user?: string;
}

// Interface for the expected shape of server data returned by GET/POST/PUT
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


// GET method to fetch all servers with joined data
export async function GET(): Promise<NextResponse> { // Added return type
  try {
    // Use dbUtils.query with await and specify expected return type
    const servers = await dbUtils.query<ServerApiResponse[]>(`
      SELECT 
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
      ORDER BY t.bench_id
    `);
    
    return NextResponse.json({ servers });

  } catch (error: unknown) { // Use unknown type for error
    console.error('Error fetching server data:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch server data', details: message },
      { status: 500 }
    );
  }
}

// POST method to add a new server
export async function POST(request: NextRequest): Promise<NextResponse> { // Use NextRequest
  try {
    const body: ServerRequestBody = await request.json();
    
    // Validate required fields
    if (!body.name || !body.platform || !body.description) {
      return NextResponse.json(
        { error: 'Name, Platform (Category), and Info (Description) are required' },
        { status: 400 }
      );
    }

    let newServer: ServerApiResponse | null = null;

    // Use dbUtils.transaction
    const benchId: number | bigint = await dbUtils.transaction(async (connection: PoolConnection) => {
      // 1. Insert into test_benches table
      const [testBenchResult] = await connection.query<ResultSetHeader>(
        `INSERT INTO test_benches (hil_name, bench_type, system_type) VALUES (?, ?, ?)`, 
        [
            body.name, 
            body.bench_type || null, 
            body.bench_type || null 
        ]
      );
      const currentBenchId = testBenchResult.insertId;
      if (!currentBenchId) throw new Error("Failed to get bench_id after insert into test_benches");
      
      // 2. Insert into test_bench_project_overview table
      await connection.query(
        `INSERT INTO test_bench_project_overview (bench_id, platform) VALUES (?, ?)`, 
        [currentBenchId, body.platform || 'Uncategorized']
      );
      
      // 3. Insert into pc_overview table
      await connection.query(
        `INSERT INTO pc_overview (bench_id, pc_name, pc_info_text, status, active_user) VALUES (?, ?, ?, ?, ?)`, 
        [
            currentBenchId, 
            body.name || null, 
            body.description || null, 
            body.status || 'online', 
            body.user || null
        ]
      );

      return currentBenchId; // Return the new ID from the transaction
    });

    // Fetch the newly created server outside the transaction to ensure it's committed
    if (benchId) {
        newServer = await dbUtils.queryOne<ServerApiResponse>(
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
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Server added successfully',
      server: newServer // Include the newly fetched server data
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
export async function PUT(request: NextRequest): Promise<NextResponse> { // Use NextRequest
  const { searchParams } = new URL(request.url);
  const benchId = searchParams.get('id');

  if (!benchId) {
    return NextResponse.json({ error: 'Bench ID is required for update' }, { status: 400 });
  }

  const numericBenchId = parseInt(benchId, 10);
  if (isNaN(numericBenchId)) {
    return NextResponse.json({ error: 'Invalid Bench ID format' }, { status: 400 });
  }

  try {
    const body: ServerRequestBody = await request.json();
    
    // Simple validation for required fields during update
    if (!body.name || !body.platform || !body.description) {
      return NextResponse.json({ error: 'Name, Platform, and Info fields are required for update' }, { status: 400 });
    }

    let updatedServer: ServerApiResponse | null = null;

    // Use dbUtils.transaction
    await dbUtils.transaction(async (connection: PoolConnection) => {
      // Check if the server exists first
      const [serverExists] = await connection.query<RowDataPacket[]>(
        'SELECT bench_id FROM test_benches WHERE bench_id = ?',
        [numericBenchId]
      );
      if (serverExists.length === 0) {
           throw new Error('Server not found'); // Throw error to trigger rollback
      }

      // 1. Update test_benches table
      await connection.query(
        `UPDATE test_benches SET hil_name = ?, bench_type = ?, system_type = ? WHERE bench_id = ?`, 
        [ 
            body.name, 
            body.bench_type || null,
            body.bench_type || null, 
            numericBenchId
        ]
      );
      
      // 2. Update or Insert test_bench_project_overview table (Upsert logic simplified)
      await connection.query(
          `INSERT INTO test_bench_project_overview (bench_id, platform) VALUES (?, ?) 
           ON DUPLICATE KEY UPDATE platform = VALUES(platform)`, 
          [numericBenchId, body.platform || 'Uncategorized']
      );
     
      // 3. Update or Insert pc_overview table (Upsert logic simplified)
      await connection.query(
          `INSERT INTO pc_overview (bench_id, pc_name, pc_info_text, status, active_user) VALUES (?, ?, ?, ?, ?) 
           ON DUPLICATE KEY UPDATE pc_name = VALUES(pc_name), pc_info_text = VALUES(pc_info_text), status = VALUES(status), active_user = VALUES(active_user)`, 
          [
            numericBenchId, 
            body.name || null, 
            body.description || null, 
            body.status || 'online', 
            body.user || null
          ]
      );
    }); // Transaction commits automatically if no error

    // Fetch the updated server data outside the transaction
    updatedServer = await dbUtils.queryOne<ServerApiResponse>(
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
        [numericBenchId]
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
    const message = error instanceof Error ? error.message : 'Unknown error';
    // Handle specific errors like 'Server not found' from the transaction
    if (message === 'Server not found') {
        return NextResponse.json({ error: message }, { status: 404 });
    }
    console.error('Error updating server:', error);
    return NextResponse.json(
      { error: 'Failed to update server', details: message },
      { status: 500 }
    );
  }
}

// DELETE method to remove a server and related data
export async function DELETE(request: NextRequest): Promise<NextResponse> { // Use NextRequest
  const { searchParams } = new URL(request.url);
  const benchId = searchParams.get('id');

  if (!benchId) {
    return NextResponse.json({ error: 'Bench ID is required' }, { status: 400 });
  }

  const numericBenchId = parseInt(benchId, 10);
  if (isNaN(numericBenchId)) {
    return NextResponse.json({ error: 'Invalid Bench ID format' }, { status: 400 });
  }

  try {
    let changes = 0;

    // Use dbUtils.transaction for deletion
    await dbUtils.transaction(async (connection: PoolConnection) => {
      // Delete associated records first
      await connection.query('DELETE FROM pc_overview WHERE bench_id = ?', [numericBenchId]);
      await connection.query('DELETE FROM test_bench_project_overview WHERE bench_id = ?', [numericBenchId]);
      // Assuming other related tables (like hil_technology) have ON DELETE CASCADE
      
      // Finally delete from the main test_benches table
      const [result] = await connection.query<ResultSetHeader>(
          'DELETE FROM test_benches WHERE bench_id = ?',
          [numericBenchId]
      );
      changes = result.affectedRows;
    });

    if (changes === 0) {
      return NextResponse.json({ error: 'Server not found or already deleted' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Server deleted successfully' });

  } catch (error: unknown) {
    console.error('Error deleting server:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to delete server', details: message },
      { status: 500 }
    );
  }
} 