import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// Interface for VM Instance data returned by API
interface VmInstance extends RowDataPacket {
    vm_id: number;
    vm_name: string;
    vm_address: string | null;
    installed_tools: string | null; // Consider JSON or a related table for better structure
}

// Interface for POST/PUT request body
interface VmInstanceRequestBody {
    vm_id?: number; // Only for PUT
    vm_name: string;
    vm_address?: string;
    installed_tools?: string;
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
    const body: VmInstanceRequestBody = await request.json();
    
    // Validate required fields
    if (!body.vm_name) {
      return NextResponse.json(
        { error: 'VM Name (vm_name) is required' },
        { status: 400 }
      );
    }

    // Insert the new VM instance record using dbUtils.insert
    const vmId = await dbUtils.insert(
      `INSERT INTO vm_instances (vm_name, vm_address, installed_tools) VALUES (?, ?, ?)`, 
      [
        body.vm_name,
        body.vm_address || null,
        body.installed_tools || null
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

// PUT method to update an existing VM instance
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body: VmInstanceRequestBody = await request.json();
    
    // Validate required fields for PUT
    if (body.vm_id === undefined || body.vm_id === null) {
      return NextResponse.json(
        { error: 'VM ID (vm_id) is required for update' },
        { status: 400 }
      );
    }
    if (!body.vm_name) {
      return NextResponse.json(
        { error: 'VM Name (vm_name) is required' },
        { status: 400 }
      );
    }

    // Update the VM instance record using dbUtils.update
    const affectedRows = await dbUtils.update(
      `UPDATE vm_instances SET
         vm_name = ?, 
         vm_address = ?, 
         installed_tools = ?
       WHERE vm_id = ?`, 
      [
        body.vm_name,
        body.vm_address || null,
        body.installed_tools || null,
        body.vm_id
      ]
    );
    
    if (affectedRows === 0) {
        // Check if the record exists at all
      const existingVm = await dbUtils.queryOne(
          `SELECT vm_id FROM vm_instances WHERE vm_id = ?`, 
          [body.vm_id]
      );
       if (!existingVm) {
           return NextResponse.json({ error: 'VM instance record not found' }, { status: 404 });
        } else {
          // Record exists, but no changes made
           const updatedVmInstance = await dbUtils.queryOne<VmInstance>(
            `SELECT * FROM vm_instances WHERE vm_id = ?`,
            [body.vm_id]
           );
           return NextResponse.json({ 
             success: true, 
             message: 'VM instance update successful (no changes detected)',
             vmInstance: updatedVmInstance
           });
        }
    }

    // Get the updated record
    const updatedVmInstance = await dbUtils.queryOne<VmInstance>(
        `SELECT * FROM vm_instances WHERE vm_id = ?`,
        [body.vm_id]
    );
        
    return NextResponse.json({ 
      success: true, 
      message: 'VM instance updated successfully',
      vmInstance: updatedVmInstance
    });
    
  } catch (error: unknown) {
    console.error('Error updating VM instance:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update VM instance', details: message },
      { status: 500 }
    );
  }
} 