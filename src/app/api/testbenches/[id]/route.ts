import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { TestBench as DatabaseTestBench } from '@/types/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { checkApiPermission } from '@/utils/server/permissionUtils';

// Interface for Test Bench data (updated to match new schema and camelCase)
interface TestBench extends RowDataPacket {
    benchId: number;
    hilName: string;
    ppNumber: string | null;
    systemType: string | null;
    benchType: string | null;
    acquisitionDate: string | null;
    location: string | null;
    projectId: number | null;
    projectName: string | null; // Joined from projects
    usagePeriod?: string | null;
    inventoryNumber?: string | null;
    eplan?: string | null;
    manufacturer: string | null;
    benchGeneration: string | null;
    purchasePrice: number | null;
    projectContact: string | null;
    modelId: number | null;
    modelName: string | null; // Joined from model_stands
}

// Interface for PUT request body (snake_case)
// This should ideally be aligned with what TestBenchList.tsx sends in formData
interface TestBenchRequestBody {
    hil_name?: string; // Optional for PUT, only if being changed
    pp_number?: string | null;
    system_type?: string | null;
    bench_type?: string | null;
    acquisition_date?: string | null;
    location?: string | null;
    project_id?: number | null;
    usage_period?: string | null;
    inventory_number?: string | null;
    eplan?: string | null;
    manufacturer?: string | null;
    bench_generation?: string | null;
    purchase_price?: number | string | null;
    project_contact?: string | null;
    model_id?: number | null;
    // bench_id is from URL for this route
}

// GET method to fetch a single test bench by ID
export async function GET(request: NextRequest, context: any): Promise<NextResponse> {
    try {
        const idStr = (context?.params?.id as string) || '';
        const bench_id = parseInt(idStr, 10);

        if (isNaN(bench_id)) {
            return NextResponse.json({ error: 'Invalid or missing Test Bench ID in URL path' }, { status: 400 });
        }

        const bench = await dbUtils.queryOne<DatabaseTestBench>(
            `SELECT 
                t.bench_id, t.hil_name, t.pp_number, t.system_type, t.bench_type, 
                DATE_FORMAT(t.acquisition_date, '%Y-%m-%d') AS acquisition_date,
                t.location, t.project_id, p.project_name, t.usage_period, t.inventory_number, 
                t.eplan, t.manufacturer, t.bench_generation, t.purchase_price, 
                t.project_contact, t.model_id, ms.model_name, pl.platform_name
             FROM test_benches t
             LEFT JOIN projects p ON t.project_id = p.project_id
             LEFT JOIN model_stands ms ON t.model_id = ms.model_id
             LEFT JOIN test_bench_project_overview tbo ON t.bench_id = tbo.bench_id
             LEFT JOIN platforms pl ON tbo.platform_id = pl.platform_id
             WHERE t.bench_id = ?`,
            [bench_id]
        );

        if (!bench) {
            return NextResponse.json({ error: 'Test Bench not found' }, { status: 404 });
        }
        // Ensure purchase_price is a number or null
        const processedBench = {
            ...bench,
            purchase_price: bench.purchase_price !== null && bench.purchase_price !== undefined 
                            ? parseFloat(String(bench.purchase_price)) 
                            : null,
        };
        return NextResponse.json({ test_bench: processedBench });

    } catch (error: unknown) {
        console.error('Error fetching test bench:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to fetch test bench', details: message },
            { status: 500 }
        );
    }
}

// PUT method to update an existing test bench
export async function PUT(request: NextRequest, context: any): Promise<NextResponse> {
  const { id } = context.params;
  // API Protection
  const permissionCheck = await checkApiPermission(request, ['Edit', 'Admin']);
  if (!permissionCheck.isAuthorized) {
    return permissionCheck.errorResponse!;
  }

  try {
    const idStr = (context?.params?.id as string) || '';
    const bench_id = parseInt(idStr, 10);

    if (isNaN(bench_id)) {
        return NextResponse.json({ error: 'Invalid or missing Test Bench ID in URL path' }, { status: 400 });
    }

    const body: Partial<TestBenchRequestBody> = await request.json();
    
    if (body.hil_name !== undefined && body.hil_name !== null && body.hil_name.trim() === '') {
      return NextResponse.json(
        { error: 'HIL Name (hil_name) cannot be empty if provided for update' },
        { status: 400 }
      );
    }

    const existingBench = await dbUtils.queryOne<DatabaseTestBench & RowDataPacket>(
        `SELECT * FROM test_benches WHERE bench_id = ?`,
        [bench_id]
    );

    if (!existingBench) {
        return NextResponse.json({ error: 'Test Bench not found' }, { status: 404 });
    }

    const updates: string[] = [];
    const values: any[] = [];

    const addUpdate = (bodyKey: keyof TestBenchRequestBody, dbField: keyof DatabaseTestBench, valueFromBoddy: any) => {
        // Check if the key was actually provided in the body
        if (Object.prototype.hasOwnProperty.call(body, bodyKey)) {
            const existingValue = existingBench[dbField];
            let valueToUpdate = valueFromBoddy;

            if (dbField === 'purchase_price' && valueToUpdate !== null && valueToUpdate !== undefined) {
                valueToUpdate = parseFloat(String(valueToUpdate));
            }
            // Only add to update if value is different or if it's explicitly set to null
            if (valueToUpdate !== existingValue || (valueToUpdate === null && existingValue !== null) ) {
                 updates.push(`${String(dbField)} = ?`);
                 values.push(valueToUpdate);
            }
        }
    };
    
    // Map body keys to TestBench interface keys for type safety with existingBench
    addUpdate('hil_name', 'hil_name', body.hil_name);
    addUpdate('pp_number', 'pp_number', body.pp_number);
    addUpdate('system_type', 'system_type', body.system_type);
    addUpdate('bench_type', 'bench_type', body.bench_type);
    addUpdate('acquisition_date', 'acquisition_date', body.acquisition_date);
    addUpdate('location', 'location', body.location);
    addUpdate('project_id', 'project_id', body.project_id);
    addUpdate('usage_period', 'usage_period', body.usage_period);
    addUpdate('inventory_number', 'inventory_number', body.inventory_number);
    addUpdate('eplan', 'eplan', body.eplan);
    addUpdate('manufacturer', 'manufacturer', body.manufacturer);
    addUpdate('bench_generation', 'bench_generation', body.bench_generation);
    addUpdate('purchase_price', 'purchase_price', body.purchase_price);
    addUpdate('project_contact', 'project_contact', body.project_contact);
    addUpdate('model_id', 'model_id', body.model_id);

    if (updates.length === 0) {
      const current_bench_data = await dbUtils.queryOne<DatabaseTestBench>(
        "SELECT t.*, p.project_name, ms.model_name, pl.platform_name FROM test_benches t LEFT JOIN projects p ON t.project_id = p.project_id LEFT JOIN model_stands ms ON t.model_id = ms.model_id LEFT JOIN test_bench_project_overview tbo ON t.bench_id = tbo.bench_id LEFT JOIN platforms pl ON tbo.platform_id = pl.platform_id WHERE t.bench_id = ?",
        [bench_id]
      );
      return NextResponse.json({ 
          success: true, 
          message: 'No changes detected. Test bench data remains the same.',
          test_bench: current_bench_data 
      });
    }
    
    if (body.project_id !== undefined && body.project_id !== existingBench.project_id) {
        if (body.project_id !== null) {
            const project = await dbUtils.queryOne('SELECT project_id FROM projects WHERE project_id = ?', [body.project_id]);
            if (!project) return NextResponse.json({ error: 'Invalid project_id. Project not found.'}, { status: 400 });
        }
    }
    if (body.model_id !== undefined && body.model_id !== existingBench.model_id) {
        if (body.model_id !== null) {
            const model = await dbUtils.queryOne('SELECT model_id FROM model_stands WHERE model_id = ?', [body.model_id]);
            if (!model) return NextResponse.json({ error: 'Invalid model_id. Model not found.'}, { status: 400 });
        }
    }

    const sql = `UPDATE test_benches SET ${updates.join(', ')} WHERE bench_id = ?`;
    values.push(bench_id);

    // Assuming dbUtils.update returns number of affectedRows or throws error
    const affectedRows = await dbUtils.update(sql, values);

    if (affectedRows === 0) {
      // This might happen if the WHERE clause (bench_id) didn't match, or if all values provided were identical to existing ones
      // and the addUpdate logic correctly filtered them out, leading to an empty `updates` array (handled above).
      // If `updates` was not empty, but affectedRows is 0, then the record wasn't found by ID during UPDATE.
      return NextResponse.json({ error: 'Test Bench not found or no effective changes made' }, { status: 404 });
    }
    
    const updated_test_bench = await dbUtils.queryOne<DatabaseTestBench>(
      "SELECT t.*, p.project_name, ms.model_name, pl.platform_name FROM test_benches t LEFT JOIN projects p ON t.project_id = p.project_id LEFT JOIN model_stands ms ON t.model_id = ms.model_id LEFT JOIN test_bench_project_overview tbo ON t.bench_id = tbo.bench_id LEFT JOIN platforms pl ON tbo.platform_id = pl.platform_id WHERE t.bench_id = ?",
      [bench_id]
    );

    return NextResponse.json({ 
        success: true, 
        message: 'Test bench updated successfully',
        test_bench: updated_test_bench 
    });

  } catch (error: unknown) {
    console.error('Error updating test bench:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
     if (message.includes('foreign key constraint fails')) {
        let fkError = 'Invalid foreign key being updated';
        if (message.includes('project_id')) fkError = 'Invalid project_id. The project does not exist.';
        if (message.includes('model_id')) fkError = 'Invalid model_id. The model does not exist.';
      return NextResponse.json(
        { error: `Failed to update test bench: ${fkError}`, details: message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update test bench', details: message },
      { status: 500 }
    );
  }
}

// It's also good practice to have a DELETE handler here
export async function DELETE(request: NextRequest, context: any): Promise<NextResponse> {
  const { id } = context.params;
  // API Protection: Only Admins and Edit users can delete
  const permissionCheck = await checkApiPermission(request, ['Admin', 'Edit']); 
  if (!permissionCheck.isAuthorized) {
    return permissionCheck.errorResponse!;
  }

  try {
    const idStr = (context?.params?.id as string) || '';
    const bench_id = parseInt(idStr, 10);

    if (isNaN(bench_id)) {
      return NextResponse.json({ error: 'Invalid or missing Test Bench ID in URL path' }, { status: 400 });
    }

    // Assuming dbUtils.update returns number of affectedRows or throws error
    const affectedRows = await dbUtils.update('DELETE FROM test_benches WHERE bench_id = ?', [bench_id]);

    if (affectedRows === 0) {
      return NextResponse.json({ error: 'Test Bench not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Test Bench deleted successfully' });

  } catch (error: unknown) {
    console.error('Error deleting test bench:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
     if (message.includes('foreign key constraint fails')) {
      return NextResponse.json(
        { error: 'Failed to delete test bench: It is referenced by other records. Please remove dependencies first.', details: message },
        { status: 409 } 
      );
    }
    return NextResponse.json(
      { error: 'Failed to delete test bench', details: message },
      { status: 500 }
    );
  }
} 