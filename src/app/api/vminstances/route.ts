import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// Interface for VM Instance data returned by API
interface VmInstance extends RowDataPacket {
    vm_id: number;
    vm_name: string;
    vm_address: string | null;
    // installed_tools: string | null; // Removed based on error
}

// Interface for POST request body
interface VmInstancePostRequestBody {
    vm_name: string;
    vm_address?: string;
    // installed_tools?: string; // Removed based on error
}

// GET method to fetch all VM instances
export async function GET(): Promise<NextResponse> {
  try {
    const vmInstances = await dbUtils.query<VmInstance[]>(
      `SELECT * FROM vm_instances ORDER BY vm_id`
    );
    
    return NextResponse.json({ vmInstances });

  } catch (error: unknown) {
    console.error('Error fetching VM instances:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch VM instances', details: message },
      { status: 500 }
    );
  }
}

// POST method to add a new VM instance
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: VmInstancePostRequestBody = await request.json();
    
    // Validate required fields
    if (!body.vm_name) {
      return NextResponse.json(
        { error: 'VM Name (vm_name) is required' },
        { status: 400 }
      );
    }

    // Insert the new VM instance record using dbUtils.insert
    // Removed installed_tools from query and params
    const vmId = await dbUtils.insert(
      `INSERT INTO vm_instances (vm_name, vm_address) VALUES (?, ?)`, 
      [
        body.vm_name,
        body.vm_address || null,
      ]
    );

    if (!vmId) {
        throw new Error("Failed to get vm_id after insert.");
    }

    // Get the newly inserted record
    const newVmInstance = await dbUtils.queryOne<VmInstance>(
      `SELECT * FROM vm_instances WHERE vm_id = ?`,
      [vmId]
    );
        
    return NextResponse.json({ 
      success: true, 
      message: 'VM instance added successfully',
      vmInstance: newVmInstance
    }, { status: 201 });
    
  } catch (error: unknown) {
    console.error('Error adding VM instance:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to add VM instance', details: message },
      { status: 500 }
    );
  }
}

// PUT method to update an existing VM instance - MOVED to [id]/route.ts
// export async function PUT(request: NextRequest): Promise<NextResponse> { ... } 