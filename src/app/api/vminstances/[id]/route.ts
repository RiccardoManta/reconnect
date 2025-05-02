import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket } from 'mysql2/promise';

// Interface for VM Instance data (same as in parent route, assuming installed_tools removed there too)
interface VmInstance extends RowDataPacket {
    vm_id: number;
    vm_name: string;
    vm_address: string | null;
    // installed_tools: string | null; // Removed
}

// Interface for PUT request body (only fields that can be updated)
interface VmInstancePutRequestBody {
    vm_name: string;
    vm_address?: string;
    // installed_tools?: string; // Removed
}

// GET method to fetch a single VM instance by ID
export async function GET(
    request: NextRequest, 
    context: { params: { id: string } }
): Promise<NextResponse> {
    const id = context.params.id;
    if (typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid or missing VM ID in params' }, { status: 400 });
    }
    const vmId = parseInt(id, 10);

    if (isNaN(vmId)) {
        return NextResponse.json({ error: 'Invalid VM ID format' }, { status: 400 });
    }

    try {
        const vmInstance = await dbUtils.queryOne<VmInstance>(
            `SELECT * FROM vm_instances WHERE vm_id = ?`,
            [vmId]
        );

        if (!vmInstance) {
            return NextResponse.json({ error: 'VM instance not found' }, { status: 404 });
        }

        return NextResponse.json({ vmInstance });

    } catch (error: unknown) {
        console.error(`Error fetching VM instance ${vmId}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to fetch VM instance', details: message },
            { status: 500 }
        );
    }
}

// DELETE method to remove a VM instance by ID
export async function DELETE(
    request: NextRequest, 
    context: { params: { id: string } }
): Promise<NextResponse> {
    const id = context.params.id;
    if (typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid or missing VM ID in params' }, { status: 400 });
    }
    const vmId = parseInt(id, 10);

    if (isNaN(vmId)) {
        return NextResponse.json({ error: 'Invalid VM ID format' }, { status: 400 });
    }

    try {
        // Use dbUtils.update for DELETE as it returns affectedRows
        const affectedRows = await dbUtils.update(
            `DELETE FROM vm_instances WHERE vm_id = ?`,
            [vmId]
        );

        if (affectedRows === 0) {
            return NextResponse.json({ error: 'VM instance not found or already deleted' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: `VM instance with ID ${vmId} deleted successfully.` });

    } catch (error: unknown) {
        console.error(`Error deleting VM instance ${vmId}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        // Add foreign key constraint check if vm_instances are referenced elsewhere
        if (message.includes('foreign key constraint fails')) {
             return NextResponse.json(
                 { error: `Failed to delete VM instance: It is still referenced by other records. Please update or remove associated records first.`, details: message },
                 { status: 400 } // Bad request due to constraint violation
             );
         }
        return NextResponse.json(
            { error: 'Failed to delete VM instance', details: message },
            { status: 500 }
        );
    }
}

// PUT method to update an existing VM instance
export async function PUT(
    request: NextRequest, 
    context: { params: { id: string } }
): Promise<NextResponse> {
    const id = context.params.id;
    if (typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid or missing VM ID in params' }, { status: 400 });
    }
    const vmId = parseInt(id, 10);

    if (isNaN(vmId)) {
        return NextResponse.json({ error: 'Invalid VM ID format' }, { status: 400 });
    }
    
    try {
        const body: VmInstancePutRequestBody = await request.json();
        
        // Validate required fields for PUT
        if (!body.vm_name) {
            return NextResponse.json(
                { error: 'VM Name (vm_name) is required' },
                { status: 400 }
            );
        }

        // Update the VM instance record using dbUtils.update
        // Removed installed_tools
        const affectedRows = await dbUtils.update(
            `UPDATE vm_instances SET
                vm_name = ?, 
                vm_address = ?
            WHERE vm_id = ?`, 
            [
                body.vm_name,
                body.vm_address || null,
                // body.installed_tools || null, // Removed
                vmId // Use vmId from URL parameter
            ]
        );
        
        if (affectedRows === 0) {
            // Check if the record exists at all
            const existingVm = await dbUtils.queryOne(
                `SELECT vm_id FROM vm_instances WHERE vm_id = ?`, 
                [vmId]
            );
            if (!existingVm) {
                return NextResponse.json({ error: 'VM instance record not found' }, { status: 404 });
            } else {
                // Record exists, but no changes made (or update failed silently)
                // Re-fetch to be sure about the current state
                const currentVmInstance = await dbUtils.queryOne<VmInstance>(
                    `SELECT * FROM vm_instances WHERE vm_id = ?`,
                    [vmId]
                );
                return NextResponse.json({ 
                    success: true, // Technically no error, but maybe indicate no change?
                    message: 'VM instance update called, but no changes were applied.',
                    vmInstance: currentVmInstance // Return current state
                });
            }
        }

        // Get the updated record
        const updatedVmInstance = await dbUtils.queryOne<VmInstance>(
            `SELECT * FROM vm_instances WHERE vm_id = ?`,
            [vmId]
        );
        
        return NextResponse.json({ 
            success: true, 
            message: 'VM instance updated successfully',
            vmInstance: updatedVmInstance
        });
        
    } catch (error: unknown) {
        console.error(`Error updating VM instance ${vmId}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        // Log the actual database error if possible
        return NextResponse.json(
            { error: 'Failed to update VM instance', details: message },
            { status: 500 }
        );
    }
} 