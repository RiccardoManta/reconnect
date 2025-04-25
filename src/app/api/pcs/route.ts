import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// Interface for PC Overview data returned by API
interface PcOverview extends RowDataPacket {
    pc_id: number;
    bench_id: number | null;
    pc_name: string | null;
    casual_name?: string | null;
    purchase_year: number | null;
    inventory_number: string | null;
    pc_role: string | null;
    pc_model: string | null;
    special_equipment: string | null;
    mac_address: string | null;
    ip_address: string | null;
    pc_info_text: string | null;
    status: string | null;
    active_user: string | null;
}

// Interface for POST/PUT request body
interface PcOverviewRequestBody {
    pc_id?: number; // Only for PUT
    bench_id: number | null;
    pc_name: string;
    casual_name?: string | null;
    purchase_year?: number | null;
    inventory_number?: string | null;
    pc_role?: string | null;
    pc_model?: string | null;
    special_equipment?: string | null;
    mac_address?: string | null;
    ip_address?: string | null;
    pc_info_text?: string | null;
    status?: string | null;
    active_user?: string | null;
}

// GET method to fetch all PC overviews
export async function GET(): Promise<NextResponse> {
  try {
    const pcs = await dbUtils.query<PcOverview[]>(
      `SELECT * FROM pc_overview ORDER BY pc_id`
    );
    
    return NextResponse.json({ pcs });

  } catch (error: unknown) {
    console.error('Error fetching PC overviews:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch PC overviews', details: message },
      { status: 500 }
    );
  }
}

// POST method to add a new PC overview
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: PcOverviewRequestBody = await request.json();
    
    // Validate required fields
    if (body.bench_id === undefined || body.bench_id === null) {
      return NextResponse.json(
        { error: 'Test bench ID (bench_id) is required' },
        { status: 400 }
      );
    }
    if (!body.pc_name) {
      return NextResponse.json(
        { error: 'PC name (pc_name) is required' },
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

    // Insert the new PC overview record using dbUtils.insert
    const pcId = await dbUtils.insert(
      `INSERT INTO pc_overview (bench_id, pc_name, casual_name, purchase_year, inventory_number, pc_role, pc_model, special_equipment, mac_address, ip_address, pc_info_text, status, active_user) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
      [
        body.bench_id,
        body.pc_name,
        body.casual_name || null,
        body.purchase_year || null,
        body.inventory_number || null,
        body.pc_role || null,
        body.pc_model || null,
        body.special_equipment || null,
        body.mac_address || null,
        body.ip_address || null,
        body.pc_info_text || null,
        body.status || null,
        body.active_user || null
      ]
    );

    if (!pcId) {
        throw new Error("Failed to get pc_id after insert.");
    }

    // Get the newly inserted record
    const newPc = await dbUtils.queryOne<PcOverview>(
      `SELECT * FROM pc_overview WHERE pc_id = ?`,
      [pcId]
    );
        
    return NextResponse.json({ 
      success: true, 
      message: 'PC overview added successfully',
      pc: newPc
    }, { status: 201 });
    
  } catch (error: unknown) {
    console.error('Error adding PC overview:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    // Specific check for foreign key constraints if needed
    if (message.includes('foreign key constraint fails')) {
      return NextResponse.json(
        { error: 'Failed to add PC overview: Invalid bench_id. The Test Bench does not exist.', details: message },
        { status: 400 } // Bad request due to invalid foreign key
      );
    }
    return NextResponse.json(
      { error: 'Failed to add PC overview', details: message },
      { status: 500 }
    );
  }
}

// PUT method to update an existing PC overview
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body: PcOverviewRequestBody = await request.json();
    
    // Validate required fields for PUT
    if (body.pc_id === undefined || body.pc_id === null) {
      console.error('[API PUT /api/pcs] Validation failed: Missing pc_id');
      return NextResponse.json({ error: 'PC ID (pc_id) is required for update' }, { status: 400 });
    }
    if (body.bench_id === undefined || body.bench_id === null) {
      console.error('[API PUT /api/pcs] Validation failed: Missing bench_id');
      return NextResponse.json({ error: 'Test bench ID (bench_id) is required' }, { status: 400 });
    }
    if (!body.pc_name) {
      console.error('[API PUT /api/pcs] Validation failed: Missing pc_name');
      return NextResponse.json({ error: 'PC name (pc_name) is required' }, { status: 400 });
    }

    // Wrap update in transaction
    const affectedRows = await dbUtils.transaction<number>(async (connection) => {
        // Re-check bench_id existence within transaction for stronger consistency
        const testBench = await connection.query<RowDataPacket[]>(
            `SELECT bench_id FROM test_benches WHERE bench_id = ?`, 
            [body.bench_id]
        );
        if (!testBench[0] || testBench[0].length === 0) {
            console.error(`[API PUT /api/pcs] (TX) Referenced bench_id=${body.bench_id} not found.`);
            // Throw error to cause rollback
            throw new Error('Referenced Test Bench with the specified bench_id not found'); 
        }

        const updateQuery = `
          UPDATE pc_overview SET
             bench_id = ?, pc_name = ?, casual_name = ?, purchase_year = ?, inventory_number = ?, 
             pc_role = ?, pc_model = ?, special_equipment = ?, mac_address = ?, 
             ip_address = ?, pc_info_text = ?, status = ?, active_user = ?
           WHERE pc_id = ?
        `; 
        const updateValues = [
            body.bench_id,
            body.pc_name,
            body.casual_name || null,
            body.purchase_year || null,
            body.inventory_number || null,
            body.pc_role || null,
            body.pc_model || null,
            body.special_equipment || null,
            body.mac_address || null,
            body.ip_address || null,
            body.pc_info_text || null,
            body.status || null,
            body.active_user || null,
            body.pc_id
          ];
          
        // Use connection.query within transaction
        const [result] = await connection.query<ResultSetHeader>(updateQuery, updateValues);
        return result.affectedRows;
    }); // End transaction
    
    // If transaction succeeded, affectedRows contains the result
    if (affectedRows === 0) {
      // Check if the record exists at all to differentiate between not found and no changes made
      const existingPc = await dbUtils.queryOne(
          `SELECT pc_id FROM pc_overview WHERE pc_id = ?`, 
          [body.pc_id]
      );
      if (!existingPc) {
        return NextResponse.json(
          { error: 'PC overview record not found' },
          { status: 404 }
        );
      } else {
         // Record exists, but no changes were made (data sent was the same as existing data)
         // Return the existing record as if updated
         const updatedPc = await dbUtils.queryOne<PcOverview>(
            `SELECT * FROM pc_overview WHERE pc_id = ?`,
            [body.pc_id]
         );
         return NextResponse.json({ 
            success: true, 
            message: 'PC overview update successful (no changes detected)',
            pc: updatedPc
         });
      }
    }

    // Get the updated record
    const updatedPc = await dbUtils.queryOne<PcOverview>(
        `SELECT * FROM pc_overview WHERE pc_id = ?`,
        [body.pc_id]
    );
        
    return NextResponse.json({ 
      success: true, 
      message: 'PC overview updated successfully',
      pc: updatedPc
    });
    
  } catch (error: unknown) {
    console.error('Error updating PC overview:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    // Specific check for foreign key constraints if needed
    if (message.includes('foreign key constraint fails')) {
      return NextResponse.json(
        { error: 'Failed to update PC overview: Invalid bench_id. The Test Bench does not exist.', details: message },
        { status: 400 } // Bad request due to invalid foreign key
      );
    }
    return NextResponse.json(
      { error: 'Failed to update PC overview', details: message },
      { status: 500 }
    );
  }
} 