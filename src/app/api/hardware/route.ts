import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise'; // ResultSetHeader is used by dbUtils.insert
import { HardwareInstallation, HardwareInstallationPostBody } from '@/types/database';
import { checkApiPermission } from '@/utils/server/permissionUtils';

// GET method to fetch hardware installation data
export async function GET(request: NextRequest): Promise<NextResponse> {
  const bench_id_param = request.nextUrl.searchParams.get('bench_id'); // Assuming query param is snake_case
  let sql = `
    SELECT 
      hi.install_id AS install_id,
      hi.hardware_group_id AS hardware_group_id,
      hgt.group_name AS group_name,
      hi.bench_id AS bench_id,
      tb.hil_name AS hil_name,
      hi.description,
      hi.hardware_number AS hardware_number,
      hi.part_number AS part_number,
      hi.software_version AS software_version,
      hi.manufacturer,
      DATE_FORMAT(hi.installation_date, '%Y-%m-%d') AS installation_date
    FROM hardware_installations hi
    JOIN hardware_group_types hgt ON hi.hardware_group_id = hgt.hardware_group_id
    JOIN test_benches tb ON hi.bench_id = tb.bench_id
  `;
  const params: any[] = [];

  if (bench_id_param) {
    sql += ' WHERE hi.bench_id = ?';
    params.push(bench_id_param);
  }
  sql += ' ORDER BY hi.install_id';

  try {
    const hardware_installations = await dbUtils.query<HardwareInstallation[]>(sql, params);
    return NextResponse.json({ hardware_installations: hardware_installations || [] });
  } catch (error: unknown) {
    console.error('Error fetching hardware installations:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch hardware installations', details: message },
      { status: 500 }
    );
  }
}

// POST method to add a new hardware installation record
export async function POST(request: NextRequest): Promise<NextResponse> {
  // API Protection
  const permissionCheck = await checkApiPermission(request, ['Edit', 'Admin']);
  if (!permissionCheck.isAuthorized) {
    return permissionCheck.errorResponse!;
  }

  try {
    const body: HardwareInstallationPostBody = await request.json();

    // Validate required fields
    if (body.hardware_group_id === undefined || body.hardware_group_id === null) {
      return NextResponse.json({ error: 'Hardware Group ID (hardware_group_id) is required' }, { status: 400 });
    }
    if (body.bench_id === undefined || body.bench_id === null) {
      return NextResponse.json({ error: 'Test Bench ID (bench_id) is required' }, { status: 400 });
    }

    // Ensure IDs are numbers
    const hardwareGroupIdNum = Number(body.hardware_group_id);
    const benchIdNum = Number(body.bench_id);

    if (isNaN(hardwareGroupIdNum)) {
      return NextResponse.json({ error: 'Hardware Group ID must be a valid number.' }, { status: 400 });
    }
    if (isNaN(benchIdNum)) {
      return NextResponse.json({ error: 'Test Bench ID must be a valid number.' }, { status: 400 });
    }

    // --- Transaction for FK checks and Insert ---
    const install_id = await dbUtils.transaction<number | bigint>(async (connection) => {
      // Check if the referenced hardware group type exists
      const [groupTypeRows] = await connection.query<RowDataPacket[]>(
        'SELECT hardware_group_id FROM hardware_group_types WHERE hardware_group_id = ?',
        [hardwareGroupIdNum]
      );
      if (groupTypeRows.length === 0) {
        const err = new Error('Hardware Group Type with the specified hardware_group_id not found');
        (err as any).statusCode = 404;
        throw err;
      }

      // Check if the referenced test bench exists
      const [testBenchRows] = await connection.query<RowDataPacket[]>(
        'SELECT bench_id FROM test_benches WHERE bench_id = ?',
        [benchIdNum]
      );
      if (testBenchRows.length === 0) {
        const err = new Error('Test Bench with the specified bench_id not found');
        (err as any).statusCode = 404;
        throw err;
      }
      
      // Insert the new hardware installation record
      const insertQuery = `
        INSERT INTO hardware_installations 
          (hardware_group_id, bench_id, description, hardware_number, part_number, software_version, manufacturer, installation_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const insertValues = [
        hardwareGroupIdNum,
        benchIdNum,
        body.description || null,
        body.hardware_number || null,
        body.part_number || null,
        body.software_version || null,
        body.manufacturer || null,
        body.installation_date || null,
      ];

      const [insertResult] = await connection.query<ResultSetHeader>(insertQuery, insertValues);
      
      if (!insertResult.insertId) {
        throw new Error('Failed to insert hardware installation: no insertId returned.');
      }
      return insertResult.insertId;
    });
    // --- Transaction End ---
    
    if (!install_id) {
        throw new Error("Failed to get install_id after transaction.");
    }

    // Get the newly inserted record with joined names
    const new_hardware_installation = await dbUtils.queryOne<HardwareInstallation>(
      `SELECT 
         hi.install_id AS install_id,
         hi.hardware_group_id AS hardware_group_id,
         hgt.group_name AS group_name,
         hi.bench_id AS bench_id,
         tb.hil_name AS hil_name,
         hi.description,
         hi.hardware_number AS hardware_number,
         hi.part_number AS part_number,
         hi.software_version AS software_version,
         hi.manufacturer,
         DATE_FORMAT(hi.installation_date, '%Y-%m-%d') AS installation_date
       FROM hardware_installations hi
       JOIN hardware_group_types hgt ON hi.hardware_group_id = hgt.hardware_group_id
       JOIN test_benches tb ON hi.bench_id = tb.bench_id
       WHERE hi.install_id = ?`,
      [install_id]
    );
        
    return NextResponse.json({ 
      message: 'Hardware installation added successfully',
      hardware_installation: new_hardware_installation 
    }, { status: 201 });
    
  } catch (error: unknown) {
    console.error('Error adding hardware installation:', error);
    const err = error as Error & { statusCode?: number };
    const message = err.message || 'Unknown error';
    const statusCode = err.statusCode || 500;

    // Check if it's one of our custom errors from the transaction
    if (message.includes('not found') && (statusCode === 404 || statusCode === 400) ){
      return NextResponse.json({ error: message }, { status: statusCode });
    }
    // Generic FK constraint error (less likely now with explicit checks)
    if (message.includes('foreign key constraint fails')) {
        return NextResponse.json({ error: 'Failed to add hardware installation due to an invalid foreign key.', details: message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to add hardware installation: ' + message, details: message }, { status: statusCode });
  }
}

// PUT handler removed, to be implemented in [id]/route.ts 