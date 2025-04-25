import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';

// DELETE: Unassign a specific software from a VM
export async function DELETE(
    request: NextRequest,
    // Using 'any' due to persistent build errors with specific context type
    context: any
): Promise<NextResponse> {
    try {
        const vmId = parseInt(context.params.vm_id, 10);
        const softwareId = parseInt(context.params.software_id, 10);

        if (isNaN(vmId) || isNaN(softwareId)) {
            return NextResponse.json({ error: 'Invalid VM ID or Software ID' }, { status: 400 });
        }

        // Use dbUtils.update as it returns affectedRows
        const affectedRows = await dbUtils.update(
            `DELETE FROM vm_software WHERE vm_id = ? AND software_id = ?`,
            [vmId, softwareId]
        );

        if (affectedRows === 0) {
            return NextResponse.json({ error: 'VM Software Assignment not found or already deleted' }, { status: 404 });
        }

        return NextResponse.json({ 
            success: true, 
            message: 'Software unassigned from VM successfully' 
        }, { status: 200 });

    } catch (error: unknown) {
        console.error('Error unassigning VM software:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to unassign VM software', details: message },
            { status: 500 }
        );
    }
} 