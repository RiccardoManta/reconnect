import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { TestBench } from '@/types/database'; // Using the global snake_case type
import { ResultSetHeader } from 'mysql2/promise';

// Interface for POST/PUT request body (snake_case)
// Derived from TestBench, but all fields are optional for PUT, some required for POST.
// For simplicity, we can define it to mirror TestBench but make fields optional as needed for PUT,
// or use Partial<TestBench> and then enforce required fields in logic.
// Let's define specific one for clarity, matching TestBench structure but snake_case for request body.
interface TestBenchRequestBody {
    hil_name: string; // Required for POST, often for PUT too
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
    purchase_price?: number | string | null; // Allow string for input flexibility, parse later
    project_contact?: string | null;
    model_id?: number | null;
    // bench_id is part of URL for PUT, not in body. For POST, it's auto-generated.
}

interface TestBenchRequestBodyForPost {
    hil_name: string; // Required for POST
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
}

// GET method to fetch all test benches
export async function GET(): Promise<NextResponse> {
  try {
    // Types from db are already snake_case. queryOne/query will map to snake_case fields of TestBench type.
    const raw_test_benches = await dbUtils.query<TestBench[]>(
      `SELECT 
        t.bench_id AS bench_id,
        t.hil_name AS hil_name,
        t.pp_number AS pp_number,
        t.system_type AS system_type,
        t.bench_type AS bench_type,
        DATE_FORMAT(t.acquisition_date, '%Y-%m-%d') AS acquisition_date,
        t.location AS location,
        t.project_id AS project_id,
        p.project_name AS project_name, -- This is a joined field, keep as is or map if TestBench type has it differently
        t.usage_period AS usage_period,
        t.inventory_number AS inventory_number,
        t.eplan AS eplan,
        t.manufacturer AS manufacturer,
        t.bench_generation AS bench_generation,
        t.purchase_price AS purchase_price,
        t.project_contact AS project_contact,
        t.model_id AS model_id,
        ms.model_name AS model_name, -- Joined field
        pl.platform_name AS platform_name -- Joined field for platform
      FROM test_benches t
      LEFT JOIN projects p ON t.project_id = p.project_id
      LEFT JOIN model_stands ms ON t.model_id = ms.model_id
      LEFT JOIN test_bench_project_overview tbo ON t.bench_id = tbo.bench_id -- Join for platform
      LEFT JOIN platforms pl ON tbo.platform_id = pl.platform_id -- Join for platform
      ORDER BY t.bench_id`
    );

    // Ensure purchase_price is a number or null
    const test_benches = raw_test_benches.map(bench => ({
      ...bench,
      purchase_price: bench.purchase_price !== null && bench.purchase_price !== undefined 
                       ? parseFloat(String(bench.purchase_price)) 
                       : null,
    }));
    
    return NextResponse.json({ test_benches });

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
    const body: TestBenchRequestBodyForPost = await request.json();
    
    if (!body.hil_name || body.hil_name.trim() === '') {
      return NextResponse.json(
        { error: 'HIL Name (hil_name) is required and cannot be empty' },
        { status: 400 }
      );
    }

    // Ensure numeric fields are correctly parsed or nulled
    const acquisitionDate = body.acquisition_date || null;
    const projectId = body.project_id === undefined ? null : Number(body.project_id) || null;
    const modelId = body.model_id === undefined ? null : Number(body.model_id) || null;
    const purchasePrice = body.purchase_price !== undefined && body.purchase_price !== null 
        ? parseFloat(String(body.purchase_price)) 
        : null;

    // Validate FKs before insert
    if (projectId !== null) {
        const project = await dbUtils.queryOne('SELECT project_id FROM projects WHERE project_id = ?', [projectId]);
        if (!project) return NextResponse.json({ error: 'Invalid project_id. Project not found.'}, { status: 400 });
    }
    if (modelId !== null) {
        const model = await dbUtils.queryOne('SELECT model_id FROM model_stands WHERE model_id = ?', [modelId]);
        if (!model) return NextResponse.json({ error: 'Invalid model_id. Model not found.'}, { status: 400 });
    }

    const bench_id = await dbUtils.insert(
      `INSERT INTO test_benches (
         hil_name, pp_number, system_type, bench_type, acquisition_date, location, project_id, 
         usage_period, inventory_number, eplan, 
         manufacturer, bench_generation, purchase_price, project_contact, model_id
       ) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
      [
        body.hil_name,
        body.pp_number || null,
        body.system_type || null,
        body.bench_type || null,
        acquisitionDate,
        body.location || null,
        projectId,
        body.usage_period || null,
        body.inventory_number || null,
        body.eplan || null,
        body.manufacturer || null,
        body.bench_generation || null,
        purchasePrice,
        body.project_contact || null,
        modelId
      ]
    );

    if (bench_id === null || bench_id === undefined) { // Changed check for insert result
        throw new Error("Failed to get bench_id after insert or insert returned an unexpected value.");
    }

    const new_test_bench = await dbUtils.queryOne<TestBench>(
      `SELECT 
         t.bench_id, t.hil_name, t.pp_number, t.system_type, t.bench_type,
         DATE_FORMAT(t.acquisition_date, '%Y-%m-%d') AS acquisition_date,
         t.location, t.project_id, p.project_name, t.usage_period, 
         t.inventory_number, t.eplan, t.manufacturer, t.bench_generation, 
         t.purchase_price, t.project_contact, t.model_id, ms.model_name,
         pl.platform_name
       FROM test_benches t
       LEFT JOIN projects p ON t.project_id = p.project_id
       LEFT JOIN model_stands ms ON t.model_id = ms.model_id
       LEFT JOIN test_bench_project_overview tbo ON t.bench_id = tbo.bench_id
       LEFT JOIN platforms pl ON tbo.platform_id = pl.platform_id
       WHERE t.bench_id = ?`,
      [bench_id]
    );
        
    return NextResponse.json({ 
      success: true, 
      message: 'Test bench added successfully',
      test_bench: new_test_bench
    }, { status: 201 });
    
  } catch (error: unknown) {
    console.error('Error adding test bench:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    // Specific handling for FK constraint failures remains useful here
    if (message.includes('foreign key constraint fails')) {
        let fkError = 'Invalid foreign key';
        if (message.includes('`project_id`')) fkError = 'Invalid project_id. The project does not exist.';
        if (message.includes('`model_id`')) fkError = 'Invalid model_id. The model does not exist.';
      return NextResponse.json(
        { error: `Failed to add test bench: ${fkError}`, details: message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to add test bench', details: message },
      { status: 500 }
    );
  }
}

// PUT handler has been moved to [id]/route.ts
// DELETE handler (if previously here and ID-specific) has been moved to [id]/route.ts 