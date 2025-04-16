import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// Interface for Test Bench data returned by API (including joined names)
interface TestBench extends RowDataPacket {
    bench_id: number;
    hil_name: string;
    pp_number: string | null;
    system_type: string | null;
    bench_type: string | null;
    acquisition_date: string | null; // Assuming date is stored as string e.g., 'YYYY-MM-DD'
    location: string | null;
    user_id: number | null;
    user_name: string | null; // Joined from users
    project_id: number | null;
    project_name: string | null; // Joined from projects
}

// Interface for POST/PUT request body (without joined names)
interface TestBenchRequestBody {
    bench_id?: number; // Only for PUT
    hil_name: string;
    pp_number?: string;
    system_type?: string;
    bench_type?: string;
    acquisition_date?: string;
    location?: string;
    user_id?: number;
    project_id?: number;
}

// GET method to fetch all test benches
export async function GET(): Promise<NextResponse> {
  try {
    const testBenches = await dbUtils.query<TestBench[]>(`
      SELECT 
        t.bench_id,
        t.hil_name,
        t.pp_number,
        t.system_type,
        t.bench_type,
        t.acquisition_date,
        t.location,
        t.user_id,
        u.user_name,
        t.project_id,
        p.project_name
      FROM test_benches t
      LEFT JOIN users u ON t.user_id = u.user_id
      LEFT JOIN projects p ON t.project_id = p.project_id
      ORDER BY t.bench_id
    `);
    
    return NextResponse.json({ testBenches });

  } catch (error: unknown) {
    console.error('Error fetching test benches:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch test benches', details: message },
      { status: 500 }
    );
  }
}

// POST method to add a new test bench
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: TestBenchRequestBody = await request.json();
    
    // Validate required fields
    if (!body.hil_name) {
      return NextResponse.json(
        { error: 'HIL Name (hil_name) is required' },
        { status: 400 }
      );
    }

    // Insert the new test bench record using dbUtils.insert
    const benchId = await dbUtils.insert(
      `INSERT INTO test_benches (hil_name, pp_number, system_type, bench_type, acquisition_date, location, user_id, project_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
      [
        body.hil_name,
        body.pp_number || null,
        body.system_type || null,
        body.bench_type || null,
        body.acquisition_date || null,
        body.location || null,
        body.user_id || null,
        body.project_id || null
      ]
    );

    if (!benchId) {
        throw new Error("Failed to get bench_id after insert.");
    }

    // Get the newly inserted record (including joined names)
    const newTestBench = await dbUtils.queryOne<TestBench>(
      `SELECT 
         t.bench_id,
         t.hil_name,
         t.pp_number,
         t.system_type,
         t.bench_type,
         t.acquisition_date,
         t.location,
         t.user_id,
         u.user_name,
         t.project_id,
         p.project_name
       FROM test_benches t
       LEFT JOIN users u ON t.user_id = u.user_id
       LEFT JOIN projects p ON t.project_id = p.project_id
       WHERE t.bench_id = ?`,
      [benchId]
    );
        
    return NextResponse.json({ 
      success: true, 
      message: 'Test bench added successfully',
      testBench: newTestBench
    }, { status: 201 });
    
  } catch (error: unknown) {
    console.error('Error adding test bench:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    // Specific check for foreign key constraints
    if (message.includes('foreign key constraint fails')) {
        let fkError = 'Invalid foreign key';
        if (message.includes('`user_id`')) fkError = 'Invalid user_id. The user does not exist.';
        if (message.includes('`project_id`')) fkError = 'Invalid project_id. The project does not exist.';
      return NextResponse.json(
        { error: `Failed to add test bench: ${fkError}`, details: message },
        { status: 400 } // Bad request due to invalid foreign key
      );
    }
    return NextResponse.json(
      { error: 'Failed to add test bench', details: message },
      { status: 500 }
    );
  }
}

// PUT method to update an existing test bench
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body: TestBenchRequestBody = await request.json();
    
    // Validate required fields for PUT
    if (body.bench_id === undefined || body.bench_id === null) {
      return NextResponse.json(
        { error: 'Bench ID (bench_id) is required for update' },
        { status: 400 }
      );
    }
    if (!body.hil_name) {
      return NextResponse.json(
        { error: 'HIL Name (hil_name) is required' },
        { status: 400 }
      );
    }

    // Update the test bench record using dbUtils.update
    const affectedRows = await dbUtils.update(
      `UPDATE test_benches SET
         hil_name = ?, 
         pp_number = ?, 
         system_type = ?, 
         bench_type = ?, 
         acquisition_date = ?, 
         location = ?, 
         user_id = ?, 
         project_id = ?
       WHERE bench_id = ?`, 
      [
        body.hil_name,
        body.pp_number || null,
        body.system_type || null,
        body.bench_type || null,
        body.acquisition_date || null,
        body.location || null,
        body.user_id || null,
        body.project_id || null,
        body.bench_id
      ]
    );
    
    if (affectedRows === 0) {
        // Check if the record exists at all
      const existingBench = await dbUtils.queryOne(
          `SELECT bench_id FROM test_benches WHERE bench_id = ?`, 
          [body.bench_id]
      );
      if (!existingBench) {
         return NextResponse.json(
          { error: 'Test bench record not found' },
          { status: 404 }
         );
       } else {
           // Record exists, but no changes made
           const updatedTestBench = await dbUtils.queryOne<TestBench>(
             `SELECT t.bench_id, t.hil_name, t.pp_number, t.system_type, t.bench_type, t.acquisition_date, t.location, t.user_id, u.user_name, t.project_id, p.project_name
              FROM test_benches t
              LEFT JOIN users u ON t.user_id = u.user_id
              LEFT JOIN projects p ON t.project_id = p.project_id
              WHERE t.bench_id = ?`,
             [body.bench_id]
           );
           return NextResponse.json({ 
             success: true, 
             message: 'Test bench update successful (no changes detected)',
             testBench: updatedTestBench
           });
       }
    }

    // Get the updated record (including joined names)
    const updatedTestBench = await dbUtils.queryOne<TestBench>(
        `SELECT 
           t.bench_id,
           t.hil_name,
           t.pp_number,
           t.system_type,
           t.bench_type,
           t.acquisition_date,
           t.location,
           t.user_id,
           u.user_name,
           t.project_id,
           p.project_name
         FROM test_benches t
         LEFT JOIN users u ON t.user_id = u.user_id
         LEFT JOIN projects p ON t.project_id = p.project_id
         WHERE t.bench_id = ?`,
        [body.bench_id]
    );
        
    return NextResponse.json({ 
      success: true, 
      message: 'Test bench updated successfully',
      testBench: updatedTestBench
    });
    
  } catch (error: unknown) {
    console.error('Error updating test bench:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    // Specific check for foreign key constraints
     if (message.includes('foreign key constraint fails')) {
        let fkError = 'Invalid foreign key';
        if (message.includes('`user_id`')) fkError = 'Invalid user_id. The user does not exist.';
        if (message.includes('`project_id`')) fkError = 'Invalid project_id. The project does not exist.';
      return NextResponse.json(
        { error: `Failed to update test bench: ${fkError}`, details: message },
        { status: 400 } // Bad request due to invalid foreign key
      );
    }
    return NextResponse.json(
      { error: 'Failed to update test bench', details: message },
      { status: 500 }
    );
  }
} 