import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';

// Interface for Project Overview data returned by API
interface ProjectOverview extends RowDataPacket {
    overview_id: number;
    bench_id: number;
    hil_name?: string;
    platform_id: number | null;
    platform_name?: string | null;
    system_supplier: string | null;
    wetbench_info: string | null;
    actuator_info: string | null;
    hardware: string | null;
    software: string | null;
    model_version: string | null;
    ticket_notes: string | null;
    wetbench_id: number | null;
    wetbench_name?: string | null;
}

// Interface for POST/PUT request body
interface ProjectOverviewRequestBody {
    overview_id?: number;
    bench_id: number;
    platform_id?: number | string | null;
    platform_name?: string;
    system_supplier?: string;
    wetbench_info?: string;
    actuator_info?: string;
    hardware?: string;
    software?: string;
    model_version?: string;
    ticket_notes?: string;
    wetbench_id?: number | string | null;
}

// Helper function to get or create platform_id
async function getOrCreatePlatformId(connection: PoolConnection, platform_name: string | undefined): Promise<number | bigint | null> {
  // Use the database pool directly if not in a transaction
  const pool = dbUtils.pool;
  if (!platform_name || platform_name.trim() === '') {
    return null;
  }
  const [existingPlatform] = await pool.query<RowDataPacket[]>(
      'SELECT platform_id FROM platforms WHERE platform_name = ?',
      [platform_name]
  );
  if (existingPlatform.length > 0) {
    return existingPlatform[0].platform_id;
  }
  const [newPlatformResult] = await pool.query<ResultSetHeader>(
      'INSERT INTO platforms (platform_name) VALUES (?)',
      [platform_name]
  );
  if (!newPlatformResult.insertId) {
      throw new Error('Failed to insert new platform');
  }
  return newPlatformResult.insertId;
}

// GET method to fetch all test bench project overviews
export async function GET(): Promise<NextResponse> {
  try {
    const project_overviews = await dbUtils.query<ProjectOverview[]>(`
      SELECT 
        o.overview_id AS overview_id,
        o.bench_id AS bench_id,
        t.hil_name AS hil_name,
        o.platform_id AS platform_id,
        p.platform_name AS platform_name,
        o.system_supplier AS system_supplier,
        o.wetbench_info AS wetbench_info,
        o.actuator_info AS actuator_info,
        o.hardware,
        o.software,
        o.model_version AS model_version,
        o.ticket_notes AS ticket_notes,
        o.wetbench_id AS wetbench_id,
        wb.wetbench_name AS wetbench_name
      FROM test_bench_project_overview o
      LEFT JOIN test_benches t ON o.bench_id = t.bench_id
      LEFT JOIN platforms p ON o.platform_id = p.platform_id
      LEFT JOIN wetbenches wb ON o.wetbench_id = wb.wetbench_id
      ORDER BY o.overview_id
    `);
    
    return NextResponse.json({ project_overviews });

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

    // Sanitize wetbench_id: if it's an empty string from form, treat as null, otherwise ensure it's a number or null.
    let final_wetbench_id: number | null = null;
    if (body.wetbench_id === '') {
        final_wetbench_id = null;
    } else if (body.wetbench_id !== undefined && body.wetbench_id !== null) {
        const numWetbenchId = Number(body.wetbench_id);
        if (!isNaN(numWetbenchId)) {
            final_wetbench_id = numWetbenchId;
        } else {
             // If it's not an empty string but also not a valid number, it's an invalid input for an ID.
            return NextResponse.json({ error: 'Invalid Wetbench ID format provided.' }, { status: 400 });
        }
    }

    // Sanitize platform_id: if it's an empty string from form, treat as null, otherwise ensure it's a number or null.
    let final_platform_id: number | null = null;
    if (body.platform_id === '') { 
        final_platform_id = null;
    } else if (body.platform_id !== undefined && body.platform_id !== null) {
        const numPlatformId = Number(body.platform_id);
        if (!isNaN(numPlatformId)) {
            final_platform_id = numPlatformId;
        } else {
            return NextResponse.json({ error: 'Invalid Platform ID format provided.' }, { status: 400 });
        }
    }
    
    // If platform_id became null after sanitization, but platform_name is provided, try to get/create by name.
    // This handles cases where 'None' (empty string) was selected for platform_id but a name was still typed elsewhere (though UI might prevent this).
    if (final_platform_id === null && body.platform_name && body.platform_name.trim() !== '') {
        final_platform_id = await getOrCreatePlatformId(dbUtils.pool as any, body.platform_name.trim()) as number | null;
    } else if (body.platform_id === undefined && body.platform_name && body.platform_name.trim() !== '') {
        // Case: platform_id was not in request at all, but platform_name was. This is the original logic for platform_name based creation.
        final_platform_id = await getOrCreatePlatformId(dbUtils.pool as any, body.platform_name.trim()) as number | null;
    }

    // Check if the referenced test bench exists
    const testBench = await dbUtils.queryOne(
        `SELECT bench_id FROM test_benches WHERE bench_id = ?`, 
        [body.bench_id]
    );
    if (!testBench) {
      return NextResponse.json({ error: 'Test Bench with the specified bench_id not found' }, { status: 404 });
    }

    // Check if wetbench_id exists if provided (and not null after sanitization)
    if (final_wetbench_id !== null) { // Simplified: if it's a number, check it.
        const wetbench = await dbUtils.queryOne(`SELECT wetbench_id FROM wetbenches WHERE wetbench_id = ?`, [final_wetbench_id]);
        if (!wetbench) {
            return NextResponse.json({ error: 'Wetbench with the specified wetbench_id not found' }, { status: 404 });
        }
    }
    
    // Check if platform_id exists if provided (and not null after sanitization)
    // Only check if platform_name isn't provided to create it, and final_platform_id is not null.
    if (final_platform_id !== null && !(body.platform_name && body.platform_name.trim() !== '')) {
        const platform = await dbUtils.queryOne(`SELECT platform_id FROM platforms WHERE platform_id = ?`, [final_platform_id]);
        if (!platform) {
            return NextResponse.json({ error: 'Platform with the specified platform_id not found' }, { status: 404 });
        }
    }

    // Insert using platform_id
    const overview_id = await dbUtils.insert(
      `INSERT INTO test_bench_project_overview (bench_id, platform_id, system_supplier, wetbench_info, actuator_info, hardware, software, model_version, ticket_notes, wetbench_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.bench_id,
        final_platform_id,
        body.system_supplier || null,
        body.wetbench_info || null,
        body.actuator_info || null,
        body.hardware || null,
        body.software || null,
        body.model_version || null,
        body.ticket_notes || null,
        final_wetbench_id
      ]
    );

    if (!overview_id) {
        throw new Error("Failed to get overview_id after insert.");
    }

    // Get the newly inserted record (joining platforms)
    const newOverview = await dbUtils.queryOne<ProjectOverview>(
      `SELECT 
         o.overview_id AS overview_id, o.bench_id AS bench_id, t.hil_name AS hil_name,
         o.platform_id AS platform_id, p.platform_name AS platform_name, 
         o.system_supplier AS system_supplier, o.wetbench_info AS wetbench_info, 
         o.actuator_info AS actuator_info, o.hardware, o.software, 
         o.model_version AS model_version, o.ticket_notes AS ticket_notes,
         o.wetbench_id AS wetbench_id, wb.wetbench_name AS wetbench_name
       FROM test_bench_project_overview o
       LEFT JOIN test_benches t ON o.bench_id = t.bench_id
       LEFT JOIN platforms p ON o.platform_id = p.platform_id
       LEFT JOIN wetbenches wb ON o.wetbench_id = wb.wetbench_id
       WHERE o.overview_id = ?`,
      [overview_id]
    );
        
    return NextResponse.json({ 
      success: true, 
      message: 'Project overview added successfully',
      project_overview: newOverview
    }, { status: 201 });
    
  } catch (error: unknown) {
    console.error('Error adding project overview:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('foreign key constraint fails')) {
      let fkError = 'Invalid foreign key';
      if (message.includes('`bench_id`')) fkError = 'Invalid bench_id.';
      if (message.includes('`platform_id`')) fkError = 'Invalid platform.';
      if (message.includes('`wetbench_id`')) fkError = 'Invalid wetbench_id.';
      return NextResponse.json({ error: `Failed to add project overview: ${fkError}`, details: message }, { status: 400 });
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
    // bench_id is required for an overview, but it might not be in the body if not being changed.
    // The logic below fetches existingOverview and only updates fields present in the body.
    // However, if bench_id IS in the body, it must be valid.
    if (body.bench_id !== undefined && (body.bench_id === null || isNaN(Number(body.bench_id)))) {
      return NextResponse.json({ error: 'Test bench ID (bench_id), if provided, must be a valid number' }, { status: 400 });
    }

    const existingOverview = await dbUtils.queryOne<ProjectOverview>(
        `SELECT * FROM test_bench_project_overview WHERE overview_id = ?`,
        [body.overview_id]
    );

    if (!existingOverview) {
        return NextResponse.json({ error: 'Project overview not found' }, { status: 404 });
    }

    // Prepare update fields: only include what's in the body or derived
    const updateFields: Partial<ProjectOverviewRequestBody> = {}; 
    // Note: ProjectOverviewRequestBody allows string for IDs, DB expects number|null.
    // We will sanitize before adding to updateFields where type mismatch could occur if not for Partial<>.

    if (body.bench_id !== undefined) {
        const numBenchId = Number(body.bench_id);
        if (isNaN(numBenchId)) return NextResponse.json({ error: 'Invalid Bench ID format provided for update.' }, { status: 400 });
        updateFields.bench_id = numBenchId;
    }

    // Sanitize and handle platform_id for updateFields
    if (body.platform_id !== undefined) {
        if (body.platform_id === '') {
            updateFields.platform_id = null;
        } else if (body.platform_id !== null) {
            const numPlatformId = Number(body.platform_id);
            if (!isNaN(numPlatformId)) {
                updateFields.platform_id = numPlatformId;
            } else {
                return NextResponse.json({ error: 'Invalid Platform ID format provided for update.' }, { status: 400 });
            }
        } else { // body.platform_id is explicitly null
             updateFields.platform_id = null;
        }
    } else if (body.platform_name !== undefined && body.platform_name !== null && body.platform_name.trim() !== '') {
        // platform_id not sent, but platform_name is. Get/create ID by name.
        updateFields.platform_id = await getOrCreatePlatformId(dbUtils.pool as any, body.platform_name.trim()) as number | null;
    } // If neither platform_id nor platform_name is in body, platform_id is not changed.

    // Sanitize and handle wetbench_id for updateFields
    if (body.wetbench_id !== undefined) {
        if (body.wetbench_id === '') {
            updateFields.wetbench_id = null;
        } else if (body.wetbench_id !== null) {
            const numWetbenchId = Number(body.wetbench_id);
            if (!isNaN(numWetbenchId)) {
                updateFields.wetbench_id = numWetbenchId;
            } else {
                return NextResponse.json({ error: 'Invalid Wetbench ID format provided for update.' }, { status: 400 });
            }
        } else { // body.wetbench_id is explicitly null
            updateFields.wetbench_id = null;
        }
    } // If wetbench_id is not in body, it's not changed.
    
    // Assign other fields if they are present in the body
    if (body.system_supplier !== undefined) updateFields.system_supplier = body.system_supplier;
    if (body.wetbench_info !== undefined) updateFields.wetbench_info = body.wetbench_info;
    if (body.actuator_info !== undefined) updateFields.actuator_info = body.actuator_info;
    if (body.hardware !== undefined) updateFields.hardware = body.hardware;
    if (body.software !== undefined) updateFields.software = body.software;
    if (body.model_version !== undefined) updateFields.model_version = body.model_version;
    if (body.ticket_notes !== undefined) updateFields.ticket_notes = body.ticket_notes;

    // Foreign key checks for changed IDs
    if (updateFields.bench_id !== undefined && updateFields.bench_id !== existingOverview.bench_id) {
        const testBench = await dbUtils.queryOne(`SELECT bench_id FROM test_benches WHERE bench_id = ?`, [updateFields.bench_id]);
        if (!testBench) return NextResponse.json({ error: 'Referenced Test Bench not found for update.' }, { status: 400 });
    }
    if (updateFields.platform_id !== undefined && updateFields.platform_id !== existingOverview.platform_id && updateFields.platform_id !== null) {
        // Only check if platform_name wasn't used (which implies it was created or already checked by getOrCreatePlatformId)
        if (!(body.platform_name !== undefined && body.platform_name !== null && body.platform_name.trim() !== '')) {
            const platform = await dbUtils.queryOne(`SELECT platform_id FROM platforms WHERE platform_id = ?`, [updateFields.platform_id]);
            if (!platform) return NextResponse.json({ error: 'Referenced Platform not found for update.' }, { status: 400 });
        }
    }
    if (updateFields.wetbench_id !== undefined && updateFields.wetbench_id !== existingOverview.wetbench_id && updateFields.wetbench_id !== null) {
        const wetbench = await dbUtils.queryOne(`SELECT wetbench_id FROM wetbenches WHERE wetbench_id = ?`, [updateFields.wetbench_id]);
        if (!wetbench) return NextResponse.json({ error: 'Referenced Wetbench not found for update.' }, { status: 400 });
    }
    
    // Remove overview_id from updateFields as it's used in WHERE, not SET
    // Also remove platform_name as we use platform_id for the update
    const { overview_id, platform_name, ...setValuesObject } = updateFields as ProjectOverviewRequestBody;

    const setClauses = Object.keys(setValuesObject).map(key => `${key} = ?`).join(', ');
    const values = Object.values(setValuesObject);

    if (setClauses.length === 0) {
        // No actual fields to update, return current record
        const currentOverview = await dbUtils.queryOne<ProjectOverview>(
          `SELECT o.overview_id AS overview_id, o.bench_id AS bench_id, t.hil_name AS hil_name,
             o.platform_id AS platform_id, p.platform_name AS platform_name, 
             o.system_supplier AS system_supplier, o.wetbench_info AS wetbench_info, 
             o.actuator_info AS actuator_info, o.hardware, o.software, 
             o.model_version AS model_version, o.ticket_notes AS ticket_notes,
             o.wetbench_id AS wetbench_id, wb.wetbench_name AS wetbench_name
           FROM test_bench_project_overview o
           LEFT JOIN test_benches t ON o.bench_id = t.bench_id
           LEFT JOIN platforms p ON o.platform_id = p.platform_id
           LEFT JOIN wetbenches wb ON o.wetbench_id = wb.wetbench_id
           WHERE o.overview_id = ?`,
          [body.overview_id]
        );
        return NextResponse.json({ 
            success: true, 
            message: 'Project overview: No changes provided.',
            project_overview: currentOverview
        });
    }

    values.push(body.overview_id); // Add overview_id for WHERE clause

    const affectedRows = await dbUtils.update(
      `UPDATE test_bench_project_overview SET ${setClauses} WHERE overview_id = ?`, 
      values
    );

    if (affectedRows > 0) {
        const updatedOverview = await dbUtils.queryOne<ProjectOverview>(
           `SELECT o.overview_id AS overview_id, o.bench_id AS bench_id, t.hil_name AS hil_name,
            o.platform_id AS platform_id, p.platform_name AS platform_name, 
            o.system_supplier AS system_supplier, o.wetbench_info AS wetbench_info, 
            o.actuator_info AS actuator_info, o.hardware, o.software, 
            o.model_version AS model_version, o.ticket_notes AS ticket_notes,
            o.wetbench_id AS wetbench_id, wb.wetbench_name AS wetbench_name
            FROM test_bench_project_overview o
            LEFT JOIN test_benches t ON o.bench_id = t.bench_id
            LEFT JOIN platforms p ON o.platform_id = p.platform_id
            LEFT JOIN wetbenches wb ON o.wetbench_id = wb.wetbench_id
            WHERE o.overview_id = ?`,
           [body.overview_id]
        );
        return NextResponse.json({ 
           success: true, 
           message: 'Project overview updated successfully',
           project_overview: updatedOverview
        });
    } else {
      // Record exists, but no changes made
      const currentOverview = await dbUtils.queryOne<ProjectOverview>(
        `SELECT 
           o.overview_id AS overview_id, o.bench_id AS bench_id, t.hil_name AS hil_name,
           o.platform_id AS platform_id, p.platform_name AS platform_name, 
           o.system_supplier AS system_supplier, o.wetbench_info AS wetbench_info, 
           o.actuator_info AS actuator_info, o.hardware, o.software, 
           o.model_version AS model_version, o.ticket_notes AS ticket_notes,
           o.wetbench_id AS wetbench_id, wb.wetbench_name AS wetbench_name
         FROM test_bench_project_overview o
         LEFT JOIN test_benches t ON o.bench_id = t.bench_id
         LEFT JOIN platforms p ON o.platform_id = p.platform_id
         LEFT JOIN wetbenches wb ON o.wetbench_id = wb.wetbench_id
         WHERE o.overview_id = ?`,
        [body.overview_id]
      );
      return NextResponse.json({ 
        success: true, 
        message: 'Project overview update successful (no changes detected)',
        project_overview: currentOverview
      });
    }

  } catch (error: unknown) {
    console.error('Error updating project overview:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('foreign key constraint fails')) {
      let fkError = 'Invalid foreign key';
      if (message.includes('`bench_id`')) fkError = 'Invalid bench_id.';
      if (message.includes('`platform_id`')) fkError = 'Invalid platform.';
      if (message.includes('`wetbench_id`')) fkError = 'Invalid wetbench_id.';
      return NextResponse.json({ error: `Failed to update project overview: ${fkError}`, details: message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update project overview', details: message }, { status: 500 });
  }
}

// Ensure no DELETE method was here unless intended.