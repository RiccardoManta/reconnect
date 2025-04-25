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
    usage_period?: string | null;
    inventory_number?: string | null;
    eplan?: string | null;
}

// Interface for POST/PUT request body (without joined names)
interface TestBenchRequestBody {
    bench_id?: number; // Only for PUT
    hil_name: string;
    pp_number?: string | null; // Allow null explicitly
    system_type?: string | null;
    bench_type?: string | null;
    acquisition_date?: string | null;
    location?: string | null;
    user_id?: number | null;
    project_id?: number | null;
    usage_period?: string | null;
    inventory_number?: string | null;
    eplan?: string | null;
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
        p.project_name,
        t.usage_period,
        t.inventory_number,
        t.eplan
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
      `INSERT INTO test_benches (hil_name, pp_number, system_type, bench_type, acquisition_date, location, user_id, project_id, usage_period, inventory_number, eplan) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
      [
        body.hil_name,
        body.pp_number || null,
        body.system_type || null,
        body.bench_type || null,
        body.acquisition_date || null,
        body.location || null,
        body.user_id || null,
        body.project_id || null,
        body.usage_period || null,
        body.inventory_number || null,
        body.eplan || null
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
         p.project_name,
         t.usage_period,
         t.inventory_number,
         t.eplan
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

    // Wrap the update in a transaction
    const affectedRows = await dbUtils.transaction<number>(async (connection) => {
      // Format acquisition_date to YYYY-MM-DD if present
      let formattedDate: string | null = null;
      if (body.acquisition_date) {
        try {
          formattedDate = new Date(body.acquisition_date).toISOString().split('T')[0];
        } catch (dateError) {
          console.error("Invalid date format received:", body.acquisition_date);
          throw new Error('Invalid Acquisition Date format provided.'); // Throw inside transaction
        }
      }

      // Ensure user_id and project_id are numbers or null
      const userIdNum = body.user_id !== null && body.user_id !== undefined ? parseInt(String(body.user_id), 10) : null;
      const projectIdNum = body.project_id !== null && body.project_id !== undefined ? parseInt(String(body.project_id), 10) : null;

      if (body.user_id !== null && body.user_id !== undefined && isNaN(userIdNum as number)) {
        throw new Error('Invalid User ID provided.');
      }
      if (body.project_id !== null && body.project_id !== undefined && isNaN(projectIdNum as number)) {
        throw new Error('Invalid Project ID provided.');
      }

      // Update the SQL query to include the missing fields
      const updateQuery = `
        UPDATE test_benches SET
           hil_name = ?, 
           pp_number = ?, 
           system_type = ?, 
           bench_type = ?, 
           acquisition_date = ?, 
           location = ?, 
           user_id = ?, 
           project_id = ?, 
           usage_period = ?,       -- Added
           inventory_number = ?,   -- Added
           eplan = ?              -- Added
         WHERE bench_id = ?
      `;

      // Add the new values to the parameters array
      const updateValues = [
        body.hil_name,
        body.pp_number || null,
        body.system_type || null,
        body.bench_type || null,
        formattedDate, 
        body.location || null,
        userIdNum,      
        projectIdNum,   
        body.usage_period || null,      // Added
        body.inventory_number || null,  // Added
        body.eplan || null,            // Added
        body.bench_id
      ];

      // Execute using connection.query within the transaction
      const [result] = await connection.query<ResultSetHeader>(updateQuery, updateValues);
      return result.affectedRows;
    });
    
    // Get the updated record (including joined names) - outside transaction
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
           p.project_name,
           t.usage_period,
           t.inventory_number,
           t.eplan
         FROM test_benches t
         LEFT JOIN users u ON t.user_id = u.user_id
         LEFT JOIN projects p ON t.project_id = p.project_id
         WHERE t.bench_id = ?`,
        [body.bench_id]
      );

     if (!updatedTestBench) {
        // This case should ideally not happen if update succeeded or found 0 rows
        return NextResponse.json({ error: 'Test bench not found after update attempt.' }, { status: 404 });
     }

    return NextResponse.json({ 
      success: true, 
      message: affectedRows > 0 ? 'Test bench updated successfully' : 'Test bench update successful (no changes detected)', 
      testBench: updatedTestBench
    });

  } catch (error: unknown) {
    console.error('Error updating test bench:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    // Improved check for foreign key constraints
    if (message.toLowerCase().includes('foreign key constraint fails')) {
      let fkField = 'related record';
      if (message.includes('`user_id`')) fkField = 'User';
      if (message.includes('`project_id`')) fkField = 'Project';
      
      const detailedError = `Invalid foreign key: The selected ${fkField} does not exist.`;
      return NextResponse.json(
        { error: detailedError, details: message },
        { status: 400 } // Bad request due to invalid FK
      );
    }

    // More specific error for other potential DB issues
    if (error instanceof Error && 'code' in error) {
        // Check for common MySQL error codes if needed
        // Example: if (error.code === 'ER_DUP_ENTRY') { ... }
        return NextResponse.json(
          { error: `Database error during update: ${error.code}`, details: message },
          { status: 500 }
        );
    }

    // Fallback generic error
    return NextResponse.json(
      { error: 'Failed to update test bench due to a server error.', details: message },
      { status: 500 }
    );
  }
} 