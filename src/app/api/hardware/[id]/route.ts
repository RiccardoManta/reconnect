import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { HardwareInstallation } from '@/types/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise'; // For type from dbUtils.update/insert
import { checkApiPermission } from '@/utils/server/permissionUtils'; // Added import

// Interface for PUT request body (snake_case)
// All fields are optional for PUT. Client sends only what needs to be changed.
interface HardwareInstallationUpdateBody {
  hardware_group_id?: number;
  bench_id?: number;
  description?: string | null;
  hardware_number?: string | null;
  part_number?: string | null;
  software_version?: string | null;
  manufacturer?: string | null;
  installation_date?: string | null; // Expecting YYYY-MM-DD string
}

// Helper function to fetch the full hardware installation details (similar to GET)
async function fetchFullHardwareInstallation(install_id: number): Promise<HardwareInstallation | null> {
    console.log(`[PUT API] fetchFullHardwareInstallation called for ID: ${install_id}`);
    return dbUtils.queryOne<HardwareInstallation>(
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
}

// Accept snake_case request body keys.
function buildUpdateQueryParts(
    body: HardwareInstallationUpdateBody,
    existingRecord: RowDataPacket & {
        hardware_group_id?: number;
        bench_id?: number;
        description?: string | null;
        hardware_number?: string | null;
        part_number?: string | null;
        software_version?: string | null;
        manufacturer?: string | null;
        installation_date?: string | null;
    }
) {
    console.log('[PUT API] buildUpdateQueryParts called with body:', JSON.stringify(body, null, 2));

    const setClauses: string[] = [];
    const values: any[] = [];
    let changesExist = false;

    // Mapping of snake_case property -> column name
    // This map is now almost an identity map for the fields it covers.
    const fieldToColumnMap: { [key in keyof HardwareInstallationUpdateBody]: string } = {
        hardware_group_id: 'hardware_group_id',
        bench_id: 'bench_id',
        description: 'description',
        hardware_number: 'hardware_number',
        part_number: 'part_number',
        software_version: 'software_version',
        manufacturer: 'manufacturer',
        installation_date: 'installation_date',
    };

    for (const key in body) {
        if (Object.prototype.hasOwnProperty.call(body, key)) {
            const typedKey = key as keyof HardwareInstallationUpdateBody;
            // Ensure the key from the body is a valid key in our map/update body type
            if (fieldToColumnMap[typedKey]) {
                const columnName = fieldToColumnMap[typedKey];
                const newValue = body[typedKey];
                const oldValue = (existingRecord as any)[columnName]; // DB columns are snake_case
                
                let effectiveOldValue = oldValue;
                if (columnName === 'installation_date' && oldValue) {
                     effectiveOldValue = String(oldValue).split('T')[0]; // Normalize date for comparison
                }
                
                if (newValue !== effectiveOldValue) {
                    changesExist = true;
                    console.log(`[PUT API] Change detected for ${columnName}: '${oldValue}' -> '${newValue}'`);
                }
                setClauses.push('`' + columnName + '` = ?');
                values.push(newValue === undefined ? null : newValue);
            }
        }
    }
    console.log('[PUT API] buildUpdateQueryParts returning:', { numSetClauses: setClauses.length, changesExist });
    return { setClauses, values, changesExist };
}

// GET method to fetch a single hardware installation by ID
export async function GET(request: NextRequest, context: any): Promise<NextResponse> {
    console.log(`GET /api/hardware/[id] - Request received for ID: ${context?.params?.id}`);
    const install_id = parseInt(context?.params?.id as string, 10);

    if (isNaN(install_id)) {
        return NextResponse.json({ error: 'Invalid installation ID format' }, { status: 400 });
    }

    try {
        const hardware_installation = await fetchFullHardwareInstallation(install_id);
        if (!hardware_installation) {
            return NextResponse.json({ error: 'Hardware installation not found' }, { status: 404 });
        }
        return NextResponse.json({ hardware_installation });

    } catch (error: unknown) {
        const err = error as Error;
        console.error(`[GET /api/hardware/${install_id}] Error: ${err.message}`, err.stack);
        return NextResponse.json(
            { error: 'Failed to fetch hardware installation', details: err.message },
            { status: 500 }
        );
    }
}

// PUT method to update an existing hardware installation by ID
export async function PUT(request: NextRequest, context: any): Promise<NextResponse> {
    const { id } = context.params;
    // API Protection
    const permissionCheck = await checkApiPermission(request, ['Edit', 'Admin']);
    if (!permissionCheck.isAuthorized) {
        return permissionCheck.errorResponse!;
    }

    const install_id = parseInt(id as string, 10);
    console.log(`[PUT /api/hardware/${install_id}] Handler started.`);

    if (isNaN(install_id)) {
        console.log(`[PUT /api/hardware/${install_id}] Invalid ID format.`);
        return NextResponse.json({ error: 'Invalid installation ID format' }, { status: 400 });
    }

    try {
        console.log(`[PUT /api/hardware/${install_id}] Parsing request body...`);
        const body: HardwareInstallationUpdateBody = await request.json();
        console.log(`[PUT /api/hardware/${install_id}] Request body parsed:`, JSON.stringify(body, null, 2));

        if (Object.keys(body).length === 0) {
            console.log(`[PUT /api/hardware/${install_id}] Request body is empty.`);
            return NextResponse.json({ error: 'Request body is empty' }, { status: 400 });
        }

        console.log(`[PUT /api/hardware/${install_id}] Fetching existing raw installation...`);
        const existingRawInstallation = await dbUtils.queryOne<RowDataPacket & HardwareInstallationUpdateBody>(
            `SELECT install_id, hardware_group_id, bench_id, description, hardware_number, part_number, software_version, manufacturer, DATE_FORMAT(installation_date, '%Y-%m-%d') as installation_date FROM hardware_installations WHERE install_id = ?`,
            [install_id]
        );
        console.log(`[PUT /api/hardware/${install_id}] Fetched existing raw installation:`, JSON.stringify(existingRawInstallation, null, 2));

        if (!existingRawInstallation) {
            console.log(`[PUT /api/hardware/${install_id}] Hardware installation not found (404).`);
            return NextResponse.json({ error: 'Hardware installation not found' }, { status: 404 });
        }

        console.log(`[PUT /api/hardware/${install_id}] Pre-validating FKs...`);
        if (body.hardware_group_id !== undefined && body.hardware_group_id !== existingRawInstallation.hardware_group_id) {
            const groupType = await dbUtils.queryOne('SELECT hardware_group_id FROM hardware_group_types WHERE hardware_group_id = ?', [body.hardware_group_id]);
            if (!groupType) {
                console.log(`[PUT /api/hardware/${install_id}] Invalid Hardware Group ID: ${body.hardware_group_id}`);
                return NextResponse.json({ error: 'Hardware Group Type with the specified hardware_group_id not found' }, { status: 400 });
            }
        }
        if (body.bench_id !== undefined && body.bench_id !== existingRawInstallation.bench_id) {
            const testBench = await dbUtils.queryOne('SELECT bench_id FROM test_benches WHERE bench_id = ?', [body.bench_id]);
            if (!testBench) {
                console.log(`[PUT /api/hardware/${install_id}] Invalid Test Bench ID: ${body.bench_id}`);
                return NextResponse.json({ error: 'Test Bench with the specified bench_id not found' }, { status: 400 });
            }
        }
        console.log(`[PUT /api/hardware/${install_id}] FKs validated.`);

        console.log(`[PUT /api/hardware/${install_id}] Building update query parts...`);
        const { setClauses, values, changesExist } = buildUpdateQueryParts(body, existingRawInstallation);
        console.log(`[PUT /api/hardware/${install_id}] Update query parts built: changesExist=${changesExist}, numClauses=${setClauses.length}`);

        if (setClauses.length === 0 && Object.keys(body).length > 0) {
             console.log(`[PUT /api/hardware/${install_id}] No valid updatable fields provided.`);
             return NextResponse.json({ error: 'No valid updatable fields provided in request body.' }, { status: 400 });
        }

        if (!changesExist) {
            console.log(`[PUT /api/hardware/${install_id}] No actual changes detected. Fetching current full installation...`);
            const currentFullInstallation = await fetchFullHardwareInstallation(install_id);
            console.log(`[PUT /api/hardware/${install_id}] Returning current installation as no changes.`);
            return NextResponse.json({ hardware_installation: currentFullInstallation, message: 'No actual changes detected.' });
        }

        const finalValues = [...values, install_id];
        const updateQuery = `UPDATE hardware_installations SET ${setClauses.join(', ')} WHERE install_id = ?`;
        console.log(`[PUT /api/hardware/${install_id}] Executing update in transaction. Query: ${updateQuery}, Values: ${JSON.stringify(finalValues)}`);

        const affectedRowsInTx = await dbUtils.transaction<number>(async (connection) => {
            console.log(`[PUT /api/hardware/${install_id}] Inside transaction: executing update...`);
            const [updateResult] = await connection.execute<ResultSetHeader>(updateQuery, finalValues);
            console.log(`[PUT /api/hardware/${install_id}] Inside transaction: update executed, affectedRows: ${updateResult.affectedRows}`);
            if (updateResult.affectedRows === 0) {
                console.warn(`[PUT /api/hardware/${install_id}] (TX WARN) Update affected 0 rows despite changes.`);
                throw new Error('Update operation affected 0 rows within transaction despite detected changes. Record may have been modified or deleted.');
            }
            return updateResult.affectedRows;
        });
        console.log(`[PUT /api/hardware/${install_id}] Transaction completed. Affected rows in TX: ${affectedRowsInTx}`);
        
        if (affectedRowsInTx === 0) {
             console.error(`[PUT /api/hardware/${install_id}] (ERROR) Transaction reported 0 affected rows post-completion.`);
             const problematicState = await fetchFullHardwareInstallation(install_id);
             return NextResponse.json({ error: 'Update transaction completed but reported 0 affected rows. Data consistency issue.', hardware_installation: problematicState }, { status: 500 });
        }

        console.log(`[PUT /api/hardware/${install_id}] Post-transaction: fetching full updated installation...`);
        const updatedInstallation = await fetchFullHardwareInstallation(install_id);
        if (!updatedInstallation) {
            console.error(`[PUT /api/hardware/${install_id}] (ERROR) Failed to retrieve hardware installation after successful update.`);
            return NextResponse.json({ error: 'Failed to retrieve hardware installation after successful update.' }, { status: 500 });
        }
        console.log(`[PUT /api/hardware/${install_id}] Successfully updated. Returning updated installation.`);
        return NextResponse.json({ hardware_installation: updatedInstallation });

    } catch (error: unknown) {
        const err = error as Error & { statusCode?: number };
        const message = err.message || 'Unknown error during hardware installation update';
        const statusCode = err.statusCode || 500;
        console.error(`[PUT /api/hardware/${install_id}] (ERROR CAUGHT) Status: ${statusCode}, Message: ${message}`, err.stack);

        if (message.toLowerCase().includes('foreign key constraint fails')) {
            return NextResponse.json({ error: 'Failed to update due to foreign key violation.', details: message }, { status: 400 });
        }
        return NextResponse.json(
            { error: `Failed to update hardware installation: ${message}`, details: message }, 
            { status: statusCode }
        );
    }
}

// DELETE method to remove a hardware installation by ID
export async function DELETE(request: NextRequest, context: any): Promise<NextResponse> {
    const { id } = context.params;
    // API Protection: Only Admins and Edit users can delete
    const permissionCheck = await checkApiPermission(request, ['Admin', 'Edit']);
    if (!permissionCheck.isAuthorized) {
        return permissionCheck.errorResponse!;
    }

    const install_id = parseInt(id as string, 10);
    console.log(`[DELETE /api/hardware/${install_id}] Handler started.`);

    if (isNaN(install_id)) {
        console.log(`[DELETE /api/hardware/${install_id}] Invalid ID format.`);
        return NextResponse.json({ error: 'Invalid installation ID format' }, { status: 400 });
    }

    try {
        console.log(`[DELETE /api/hardware/${install_id}] Checking if record exists...`);
        const existing = await dbUtils.queryOne('SELECT install_id FROM hardware_installations WHERE install_id = ?', [install_id]);
        if (!existing) {
            console.log(`[DELETE /api/hardware/${install_id}] Record not found (404).`);
            return NextResponse.json({ error: 'Hardware installation not found' }, { status: 404 });
        }
        console.log(`[DELETE /api/hardware/${install_id}] Record exists. Proceeding with delete...`);
        const affectedRowsDelete = await dbUtils.update(
            'DELETE FROM hardware_installations WHERE install_id = ?',
            [install_id]
        );
        console.log(`[DELETE /api/hardware/${install_id}] Delete operation completed. Affected rows: ${affectedRowsDelete}`);
        if (affectedRowsDelete === 0) {
            console.warn(`[DELETE /api/hardware/${install_id}] (WARN) Delete affected 0 rows after existence check.`);
            return NextResponse.json({ error: 'Hardware installation not found or already deleted' }, { status: 404 });
        }
        console.log(`[DELETE /api/hardware/${install_id}] Successfully deleted.`);
        return NextResponse.json({ success: true, message: 'Hardware installation with ID ' + install_id + ' deleted successfully.' });

    } catch (error: unknown) {
        const err = error as Error;
        const message = err.message || 'Unknown error during delete operation';
        console.error(`[DELETE /api/hardware/${install_id}] (ERROR CAUGHT) Message: ${message}`, err.stack);
        if (message.toLowerCase().includes('foreign key constraint fails')) {
             return NextResponse.json(
                 { error: 'Failed to delete hardware installation: It might be referenced by other records.', details: message },
                 { status: 400 }
             );
         }
        return NextResponse.json(
            { error: 'Failed to delete hardware installation', details: message },
            { status: 500 }
        );
    }
} 