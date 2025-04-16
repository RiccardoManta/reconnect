import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// Interface for Project Overview data returned by API (including joined hil_name)
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

// Interface for POST/PUT request body (without hil_name)
interface ProjectOverviewRequestBody {
    overview_id?: number; // Only for PUT
    bench_id: number;
    platform?: string;
    system_supplier?: string;
    wetbench_info?: string;
    actuator_info?: string;
    hardware?: string;
    software?: string;
    model_version?: string;
    ticket_notes?: string;
}

// GET method to fetch all test bench project overviews
export async function GET(): Promise<NextResponse> {
  try {
    const projectOverviews = await dbUtils.query<ProjectOverview[]>(`
      SELECT o.*, t.hil_name
      FROM test_bench_project_overview o
      LEFT JOIN test_benches t ON o.bench_id = t.bench_id
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
    
    // Validate required fields
    if (body.bench_id === undefined || body.bench_id === null) {
      return NextResponse.json(
        { error: 'Test bench ID (bench_id) is required' },
        { status: 400 }
      );
    }

    // Check if the referenced test bench exists
    const testBench = await dbUtils.queryOne(
        `SELECT bench_id FROM test_benches WHERE bench_id = ?`, 
        [body.bench_id]
    );
    if (!testBench) {
      return NextResponse.json(
        { error: 'Test Bench with the specified bench_id not found' },
        { status: 404 }
      );
    }

    // Insert the new project overview record using dbUtils.insert
    const overviewId = await dbUtils.insert(
      `INSERT INTO test_bench_project_overview (bench_id, platform, system_supplier, wetbench_info, actuator_info, hardware, software, model_version, ticket_notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
      [
        body.bench_id,
        body.platform || null,
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

    // Get the newly inserted record (including hil_name)
    const newOverview = await dbUtils.queryOne<ProjectOverview>(
      `SELECT o.*, t.hil_name
       FROM test_bench_project_overview o
       LEFT JOIN test_benches t ON o.bench_id = t.bench_id
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
    // Specific check for foreign key constraints if needed
    if (message.includes('foreign key constraint fails')) {
      return NextResponse.json(
        { error: 'Failed to add project overview: Invalid bench_id. The Test Bench does not exist.', details: message },
        { status: 400 } // Bad request due to invalid foreign key
      );
    }
    return NextResponse.json(
      { error: 'Failed to add project overview', details: message },
      { status: 500 }
    );
  }
}

// PUT method to update an existing test bench project overview
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body: ProjectOverviewRequestBody = await request.json();
    
    // Validate required fields for PUT
    if (body.overview_id === undefined || body.overview_id === null) {
      return NextResponse.json(
        { error: 'Overview ID (overview_id) is required for update' },
        { status: 400 }
      );
    }
    if (body.bench_id === undefined || body.bench_id === null) {
      return NextResponse.json(
        { error: 'Test bench ID (bench_id) is required' },
        { status: 400 }
      );
    }

    // Check if the referenced test bench exists
    const testBench = await dbUtils.queryOne(
        `SELECT bench_id FROM test_benches WHERE bench_id = ?`, 
        [body.bench_id]
    );
    if (!testBench) {
      return NextResponse.json(
        { error: 'Referenced Test Bench with the specified bench_id not found' },
        { status: 404 }
      );
    }

    // Update the project overview record using dbUtils.update
    const affectedRows = await dbUtils.update(
      `UPDATE test_bench_project_overview SET
         bench_id = ?, 
         platform = ?, 
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
        body.platform || null,
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
    
    if (affectedRows === 0) {
       // Check if the record exists at all to differentiate between not found and no changes made
      const existingOverview = await dbUtils.queryOne(
          `SELECT overview_id FROM test_bench_project_overview WHERE overview_id = ?`, 
          [body.overview_id]
      );
      if (!existingOverview) {
         return NextResponse.json(
          { error: 'Project overview record not found' },
          { status: 404 }
         );
      } else {
        // Record exists, but no changes were made (data sent was the same as existing data)
        // Return the existing record as if updated
        const updatedOverview = await dbUtils.queryOne<ProjectOverview>(
           `SELECT o.*, t.hil_name
            FROM test_bench_project_overview o
            LEFT JOIN test_benches t ON o.bench_id = t.bench_id
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

    // Get the updated record (including hil_name)
    const updatedOverview = await dbUtils.queryOne<ProjectOverview>(
        `SELECT o.*, t.hil_name
         FROM test_bench_project_overview o
         LEFT JOIN test_benches t ON o.bench_id = t.bench_id
         WHERE o.overview_id = ?`,
        [body.overview_id]
    );
        
    return NextResponse.json({ 
      success: true, 
      message: 'Project overview updated successfully',
      projectOverview: updatedOverview
    });
    
  } catch (error: unknown) {
    console.error('Error updating project overview:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
     // Specific check for foreign key constraints if needed
    if (message.includes('foreign key constraint fails')) {
      return NextResponse.json(
        { error: 'Failed to update project overview: Invalid bench_id. The Test Bench does not exist.', details: message },
        { status: 400 } // Bad request due to invalid foreign key
      );
    }
    return NextResponse.json(
      { error: 'Failed to update project overview', details: message },
      { status: 500 }
    );
  }
} 