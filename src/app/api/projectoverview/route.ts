import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';

// Interface for Project Overview data returned by API
interface ProjectOverview extends RowDataPacket {
    overview_id: number;
    bench_id: number;
    hil_name: string;
    platform_id: number | null;
    platform_name: string | null;
    system_supplier: string | null;
    wetbench_info: string | null;
    actuator_info: string | null;
    hardware: string | null;
    software: string | null;
    model_version: string | null;
    ticket_notes: string | null;
}

// Interface for POST/PUT request body (accepts platform_name)
interface ProjectOverviewRequestBody {
    overview_id?: number; // Only for PUT
    bench_id: number;
    platform_name?: string;
    system_supplier?: string;
    wetbench_info?: string;
    actuator_info?: string;
    hardware?: string;
    software?: string;
    model_version?: string;
    ticket_notes?: string;
}

// Helper function to get or create platform_id (copied from /api/servers)
async function getOrCreatePlatformId(connection: PoolConnection, platformName: string | undefined): Promise<number | bigint | null> {
  // Use the database pool directly if not in a transaction
  const pool = dbUtils.pool;
  if (!platformName || platformName.trim() === '') {
    return null;
  }
  const [existingPlatform] = await pool.query<RowDataPacket[]>(
      'SELECT platform_id FROM platforms WHERE platform_name = ?',
      [platformName]
  );
  if (existingPlatform.length > 0) {
    return existingPlatform[0].platform_id;
  }
  const [newPlatformResult] = await pool.query<ResultSetHeader>(
      'INSERT INTO platforms (platform_name) VALUES (?)',
      [platformName]
  );
  if (!newPlatformResult.insertId) {
      throw new Error('Failed to insert new platform');
  }
  return newPlatformResult.insertId;
}

// GET method to fetch all test bench project overviews
export async function GET(): Promise<NextResponse> {
  try {
    // UPDATE Query to join with platforms
    const projectOverviews = await dbUtils.query<ProjectOverview[]>(`
      SELECT 
        o.*, 
        t.hil_name,
        p.platform_name -- Select platform_name
      FROM test_bench_project_overview o
      LEFT JOIN test_benches t ON o.bench_id = t.bench_id
      LEFT JOIN platforms p ON o.platform_id = p.platform_id -- Join platforms
      ORDER BY o.overview_id
    `);
    
    return NextResponse.json({ projectOverviews });

  } catch (error: unknown) {
    console.error('Error fetching project overviews:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch project overviews', details: message },
      { status: 500 }
    );
  }
}

// POST method to add a new test bench project overview
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: ProjectOverviewRequestBody = await request.json();
    
    if (body.bench_id === undefined || body.bench_id === null) {
      return NextResponse.json({ error: 'Test bench ID (bench_id) is required' }, { status: 400 });
    }

    // Get or create platform_id using helper
    // Pass the pool connection - assuming this might run within a transaction later if needed
    // For now, the helper uses the pool directly.
    const platformId = await getOrCreatePlatformId(dbUtils.pool as any, body.platform_name);

    // Check if the referenced test bench exists
    const testBench = await dbUtils.queryOne(
        `SELECT bench_id FROM test_benches WHERE bench_id = ?`, 
        [body.bench_id]
    );
    if (!testBench) {
      return NextResponse.json({ error: 'Test Bench with the specified bench_id not found' }, { status: 404 });
    }

    // Insert using platform_id
    const overviewId = await dbUtils.insert(
      `INSERT INTO test_bench_project_overview (bench_id, platform_id, system_supplier, wetbench_info, actuator_info, hardware, software, model_version, ticket_notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
      [
        body.bench_id,
        platformId, // Use platformId
        body.system_supplier || null,
        body.wetbench_info || null,
        body.actuator_info || null,
        body.hardware || null,
        body.software || null,
        body.model_version || null,
        body.ticket_notes || null
      ]
    );

    if (!overviewId) {
        throw new Error("Failed to get overview_id after insert.");
    }

    // Get the newly inserted record (joining platforms)
    const newOverview = await dbUtils.queryOne<ProjectOverview>(
      `SELECT 
         o.*, 
         t.hil_name,
         p.platform_name
       FROM test_bench_project_overview o
       LEFT JOIN test_benches t ON o.bench_id = t.bench_id
       LEFT JOIN platforms p ON o.platform_id = p.platform_id
       WHERE o.overview_id = ?`,
      [overviewId]
    );
        
    return NextResponse.json({ 
      success: true, 
      message: 'Project overview added successfully',
      projectOverview: newOverview
    }, { status: 201 });
    
  } catch (error: unknown) {
    console.error('Error adding project overview:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('foreign key constraint fails')) {
      return NextResponse.json({ error: 'Failed to add project overview: Invalid bench_id or platform.', details: message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to add project overview', details: message }, { status: 500 });
  }
}

// PUT method to update an existing test bench project overview
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body: ProjectOverviewRequestBody = await request.json();
    
    if (body.overview_id === undefined || body.overview_id === null) {
      return NextResponse.json({ error: 'Overview ID (overview_id) is required for update' }, { status: 400 });
    }
    if (body.bench_id === undefined || body.bench_id === null) {
      return NextResponse.json({ error: 'Test bench ID (bench_id) is required' }, { status: 400 });
    }

    // Get or create platform_id using helper
    const platformId = await getOrCreatePlatformId(dbUtils.pool as any, body.platform_name);

    // Check if the referenced test bench exists
    const testBench = await dbUtils.queryOne(
        `SELECT bench_id FROM test_benches WHERE bench_id = ?`, 
        [body.bench_id]
    );
    if (!testBench) {
      return NextResponse.json({ error: 'Referenced Test Bench with the specified bench_id not found' }, { status: 404 });
    }

    // Update using platform_id
    const affectedRows = await dbUtils.update(
      `UPDATE test_bench_project_overview SET
         bench_id = ?, 
         platform_id = ?, -- Use platform_id
         system_supplier = ?, 
         wetbench_info = ?,
         actuator_info = ?,
         hardware = ?,
         software = ?,
         model_version = ?,
         ticket_notes = ?
       WHERE overview_id = ?`, 
      [
        body.bench_id,
        platformId, // Use platformId
        body.system_supplier || null,
        body.wetbench_info || null,
        body.actuator_info || null,
        body.hardware || null,
        body.software || null,
        body.model_version || null,
        body.ticket_notes || null,
        body.overview_id
      ]
    );
    
    // Fetch logic remains largely the same, but ensure the query joins platforms
    let updatedOverview: ProjectOverview | null = null;
    if (affectedRows > 0) {
        updatedOverview = await dbUtils.queryOne<ProjectOverview>(
           `SELECT o.*, t.hil_name, p.platform_name
            FROM test_bench_project_overview o
            LEFT JOIN test_benches t ON o.bench_id = t.bench_id
            LEFT JOIN platforms p ON o.platform_id = p.platform_id
            WHERE o.overview_id = ?`,
           [body.overview_id]
        );
    } else {
      const existingOverview = await dbUtils.queryOne(
          `SELECT overview_id FROM test_bench_project_overview WHERE overview_id = ?`, 
          [body.overview_id]
      );
      if (!existingOverview) {
         return NextResponse.json({ error: 'Project overview record not found' }, { status: 404 });
      } else {
        updatedOverview = await dbUtils.queryOne<ProjectOverview>(
           `SELECT o.*, t.hil_name, p.platform_name
            FROM test_bench_project_overview o
            LEFT JOIN test_benches t ON o.bench_id = t.bench_id
            LEFT JOIN platforms p ON o.platform_id = p.platform_id
            WHERE o.overview_id = ?`,
           [body.overview_id]
        );
        return NextResponse.json({ 
           success: true, 
           message: 'Project overview update successful (no changes detected)',
           projectOverview: updatedOverview
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Project overview updated successfully',
      projectOverview: updatedOverview
    });
    
  } catch (error: unknown) {
    console.error('Error updating project overview:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('foreign key constraint fails')) {
      return NextResponse.json({ error: 'Failed to update project overview: Invalid bench_id or platform.', details: message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update project overview', details: message }, { status: 500 });
  }
}

// DELETE method - No changes needed unless it specifically used the platform field
// export async function DELETE(request: NextRequest): Promise<NextResponse> { ... } 