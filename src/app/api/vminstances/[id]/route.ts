import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket } from 'mysql2/promise';
import { checkApiPermission } from '@/utils/server/permissionUtils';
import { VmInstance as VmInstanceType, VmInstancePostRequestBody } from '@/types/database';

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
    context: any
): Promise<NextResponse> {
    const id = (context?.params?.id as string) || '';
    if (!id) {
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

        return NextResponse.json({ vm_instance: vmInstance });

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
    context: any
): Promise<NextResponse> {
    const permissionCheck = await checkApiPermission(request, ['Admin', 'Edit']);
    if (!permissionCheck.isAuthorized) {
        return permissionCheck.errorResponse!;
    }
    const id = (context?.params?.id as string) || '';
    if (!id) {
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
    context: any
): Promise<NextResponse> {
    const permissionCheck = await checkApiPermission(request, ['Edit', 'Admin']);
    if (!permissionCheck.isAuthorized) {
        return permissionCheck.errorResponse!;
    }
    const id = (context?.params?.id as string) || '';
    if (!id) {
        return NextResponse.json({ error: 'Invalid or missing VM ID in params' }, { status: 400 });
    }
    const vmId = parseInt(id, 10);

    if (isNaN(vmId)) {
        return NextResponse.json({ error: 'Invalid VM ID format' }, { status: 400 });
    }
    
    try {
        const body: Partial<VmInstancePostRequestBody> = await request.json();
        if (Object.keys(body).length === 0) {
            return NextResponse.json({ error: 'Request body is empty' }, { status: 400 });
        }
        if (body.vm_name !== undefined && (typeof body.vm_name !== 'string' || body.vm_name.trim() === '')) {
            return NextResponse.json({ error: 'VM name cannot be empty' }, { status: 400 });
        }

        const fieldsToUpdate: string[] = [];
        const values: any[] = [];

        if (body.vm_name !== undefined) { fieldsToUpdate.push('vm_name = ?'); values.push(body.vm_name); }
        if (body.vm_address !== undefined) { fieldsToUpdate.push('vm_address = ?'); values.push(body.vm_address); }

        if (fieldsToUpdate.length === 0) {
            return NextResponse.json({ error: 'No valid fields provided for update' }, { status: 400 });
        }

        values.push(vmId); // For the WHERE clause

        const affectedRows = await dbUtils.update(
            `UPDATE vm_instances SET ${fieldsToUpdate.join(', ')} WHERE vm_id = ?`,
            values
        );

        if (affectedRows === 0) {
            return NextResponse.json({ error: 'VM instance not found or no changes made' }, { status: 404 });
        }
        const updatedVm = await dbUtils.queryOne<VmInstanceType>('SELECT * FROM vm_instances WHERE vm_id = ?', [vmId]);
        return NextResponse.json({ success: true, vm_instance: updatedVm });
    } catch (error: unknown) {
        console.error(`Error updating VM instance ${vmId}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to update VM instance', details: message },
            { status: 500 }
        );
    }
} 