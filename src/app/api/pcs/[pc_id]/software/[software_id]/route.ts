import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';

// DELETE: Unassign a specific software from a PC
export async function DELETE(
    request: NextRequest,
    // Using 'any' because the specific type { params: { ... } } 
    // caused persistent build errors in the Docker environment (Next.js 15.3.0).
    context: any 
): Promise<NextResponse> {
    try {
        // Access params via context.params.pc_id and context.params.software_id
        const pcId = parseInt(context.params.pc_id, 10);
        const softwareId = parseInt(context.params.software_id, 10);

        if (isNaN(pcId) || isNaN(softwareId)) {
            return NextResponse.json({ error: 'Invalid PC ID or Software ID' }, { status: 400 });
        }

        // Use dbUtils.update as it returns affectedRows
        const affectedRows = await dbUtils.update(
            `DELETE FROM pc_software WHERE pc_id = ? AND software_id = ?`,
            [pcId, softwareId]
        );

        if (affectedRows === 0) {
            // Could be that the PC/Software doesn't exist, or the assignment didn't exist
            return NextResponse.json({ error: 'Assignment not found or already deleted' }, { status: 404 });
        }

        return NextResponse.json({ 
            success: true, 
            message: 'Software unassigned successfully' 
        }, { status: 200 });

    } catch (error: unknown) {
        console.error('Error unassigning software:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        // No specific FK errors expected on DELETE from linking table unless others depend on it (unlikely)
        return NextResponse.json(
            { error: 'Failed to unassign software', details: message },
            { status: 500 }
        );
    }
} 