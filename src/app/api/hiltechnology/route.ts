import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { HilTechnology as HilTechnologyType, HilTechnologyRequestBody, TestBench } from '@/types/database';
import { checkApiPermission } from '@/utils/server/permissionUtils';

// GET method to fetch all HIL technology data
export async function GET(): Promise<NextResponse> {
  try {
    const technology = await dbUtils.query<HilTechnologyType[]>(`
      SELECT h.*, t.hil_name 
      FROM hil_technology h
      LEFT JOIN test_benches t ON h.bench_id = t.bench_id
      ORDER BY h.tech_id
    `);
    
    return NextResponse.json({ technology });

  } catch (error: unknown) {
    console.error('Error fetching HIL technology data:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch HIL technology data', details: message },
      { status: 500 }
    );
  }
}

// POST method to add a new HIL technology entry
export async function POST(request: NextRequest, context: any): Promise<NextResponse> {
    // API Protection
    const permissionCheck = await checkApiPermission(request, ['Edit', 'Admin']);
    if (!permissionCheck.isAuthorized) {
        return permissionCheck.errorResponse!;
    }
    try {
        const body: HilTechnologyRequestBody = await request.json();

        // Basic validation
        if (!body.bench_id) {
            return NextResponse.json({ error: 'Test Bench ID (bench_id) is required.' }, { status: 400 });
        }
        // Add more validation as needed for other fields

        const result = await dbUtils.insert(
            `INSERT INTO hil_technology (bench_id, fiu_info, io_info, can_interface, power_interface, possible_tests, leakage_module) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`, 
            [
                body.bench_id, 
                body.fiu_info || null, 
                body.io_info || null, 
                body.can_interface || null,
                body.power_interface || null,
                body.possible_tests || null,
                body.leakage_module || null
            ]
        );
        const newHilTechId = result;

        // Fetch the newly created record with joined data to return it
        const newHilTechnology = await dbUtils.queryOne<HilTechnologyType>(
            `SELECT ht.*, tb.hil_name 
             FROM hil_technology ht
             JOIN test_benches tb ON ht.bench_id = tb.bench_id
             WHERE ht.tech_id = ?`,
            [newHilTechId]
        );

        return NextResponse.json({ success: true, hil_technology: newHilTechnology }, { status: 201 });

    } catch (error: unknown) {
        console.error('[API POST /api/hiltechnology] Error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        if (message.includes('foreign key constraint fails')) {
            return NextResponse.json(
                { error: `Failed to add HIL technology: Invalid bench_id.`, details: message },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: 'Failed to add HIL technology entry', details: message },
            { status: 500 }
        );
    }
}

// PUT method to update an existing HIL technology entry
/*
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body: HilTechnologyRequestBody = await request.json();
    
    // Validate required fields for PUT
    if (!body.tech_id) {
      return NextResponse.json(
        { error: 'Technology ID (tech_id) is required for update' },
        { status: 400 }
      );
    }
    if (!body.bench_id) {
      return NextResponse.json(
        { error: 'Test Bench ID (bench_id) is required' },
        { status: 400 }
      );
    }

    // Check if the referenced test bench exists
    const testBench = await dbUtils.queryOne(
        \`SELECT bench_id FROM test_benches WHERE bench_id = ?\`, 
        [body.bench_id]
    );
    if (!testBench) {
      return NextResponse.json(
        { error: 'Referenced Test Bench with the specified bench_id not found' },
        { status: 404 }
      );
    }

    // Update the HIL technology record using dbUtils.update
    const affectedRows = await dbUtils.update(
      \`UPDATE hil_technology SET
         bench_id = ?, 
         fiu_info = ?, 
         io_info = ?,
         can_interface = ?,
         power_interface = ?,
         possible_tests = ?,
         leakage_module = ?
       WHERE tech_id = ?\`, 
      [
        body.bench_id,
        body.fiu_info || null,
        body.io_info || null,
        body.can_interface || null,
        body.power_interface || null,
        body.possible_tests || null,
        body.leakage_module || null,
        body.tech_id
      ]
    );
    
    if (affectedRows === 0) {
      return NextResponse.json(
        { error: 'HIL technology record not found or no changes made' },
        { status: 404 }
      );
    }

    // Get the updated record
    const updatedTechnology = await dbUtils.queryOne<HilTechnologyType>(
        \`SELECT h.*, t.hil_name 
         FROM hil_technology h
         LEFT JOIN test_benches t ON h.bench_id = t.bench_id
         WHERE h.tech_id = ?\`,
        [body.tech_id]
    );
        
    return NextResponse.json({ 
      success: true, 
      message: 'HIL technology updated successfully',
      technology: updatedTechnology
    });
    
  } catch (error: unknown) {
    console.error('Error updating HIL technology:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update HIL technology', details: message },
      { status: 500 }
    );
  }
} 
*/ 