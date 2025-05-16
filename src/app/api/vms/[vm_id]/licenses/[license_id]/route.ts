import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { checkApiPermission } from '@/utils/server/permissionUtils';
import { RowDataPacket } from 'mysql2/promise';

// Define an interface for the assignment_id query result
interface AssignmentIdPacket extends RowDataPacket {
    assignment_id: number;
}

export async function DELETE(
    request: NextRequest, 
    context: any // { params: { vm_id: string, license_id: string } }
): Promise<NextResponse> {
    const permissionCheck = await checkApiPermission(request, ['Admin', 'Edit']);
    if (!permissionCheck.isAuthorized) {
        return permissionCheck.errorResponse!;
    }

    const vmIdStr = context?.params?.vm_id as string;
    const licenseIdStr = context?.params?.license_id as string;

    if (!vmIdStr || !licenseIdStr) {
        return NextResponse.json({ error: 'VM ID and License ID are required' }, { status: 400 });
    }

    const vmId = parseInt(vmIdStr, 10);
    const licenseId = parseInt(licenseIdStr, 10);

    if (isNaN(vmId) || isNaN(licenseId)) {
        return NextResponse.json({ error: 'Invalid VM ID or License ID format' }, { status: 400 });
    }

    try {
        // Find the assignment_id first from license_assignments
        const assignment = await dbUtils.queryOne<AssignmentIdPacket>(
            'SELECT assignment_id FROM license_assignments WHERE license_id = ? AND vm_id = ?',
            [licenseId, vmId]
        );

        if (!assignment) {
            return NextResponse.json({ error: 'License not assigned to this VM or assignment not found' }, { status: 404 });
        }

        // Use a transaction to ensure the trigger fires correctly
        await dbUtils.transaction(async (connection) => {
            // The trigger trg_lic_move_unassign_vm should handle logging the move event
            // by setting pc_id and vm_id to NULL for this assignment_id.
            // This action effectively "unassigns" it by making it available again.
            // The actual deletion from license_assignments might not be what we want if we track history.
            // If unassignment means setting vm_id to NULL:
            const result = await dbUtils.update(
                'UPDATE license_assignments SET vm_id = NULL WHERE assignment_id = ? AND license_id = ?',
                [assignment.assignment_id, licenseId],
                connection // Pass connection for transaction
            );
            if (result === 0) {
                 // This case should ideally not be hit if the assignment was found above.
                throw new Error('Failed to unassign license: Assignment not found or no change made during update.');
            }
        });

        return NextResponse.json({ success: true, message: `License ID ${licenseId} unassigned from VM ID ${vmId} successfully.` });

    } catch (error: unknown) {
        console.error(`Error unassigning license ${licenseId} from VM ${vmId}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        // Check for foreign key constraint errors if deleting directly from license_assignments was intended
        // if (message.includes('foreign key constraint fails')) { ... }
        return NextResponse.json(
            { error: 'Failed to unassign license', details: message },
            { status: 500 }
        );
    }
} 