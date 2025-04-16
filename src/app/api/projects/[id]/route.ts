import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket } from 'mysql2/promise';

// Interface for Project data (same as in parent route)
interface Project extends RowDataPacket {
    project_id: number;
    project_number: string | null;
    project_name: string;
}

// GET method to fetch a single project by ID
export async function GET(request: NextRequest, context: any): Promise<NextResponse> {
    // Assuming context structure { params: { id: string } }
    const id = context?.params?.id;
    if (typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid or missing project ID in params' }, { status: 400 });
    }
    const projectId = parseInt(id, 10);

    if (isNaN(projectId)) {
        return NextResponse.json({ error: 'Invalid project ID format' }, { status: 400 });
    }

    try {
        const project = await dbUtils.queryOne<Project>(
            `SELECT * FROM projects WHERE project_id = ?`,
            [projectId]
        );

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        return NextResponse.json({ project });

    } catch (error: unknown) {
        console.error(`Error fetching project ${projectId}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to fetch project', details: message },
            { status: 500 }
        );
    }
}

// DELETE method to remove a project by ID
export async function DELETE(request: NextRequest, context: any): Promise<NextResponse> {
    // Assuming context structure { params: { id: string } }
    const id = context?.params?.id;
     if (typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid or missing project ID in params' }, { status: 400 });
    }
    const projectId = parseInt(id, 10);

    if (isNaN(projectId)) {
        return NextResponse.json({ error: 'Invalid project ID format' }, { status: 400 });
    }

    try {
        const affectedRows = await dbUtils.update(
            `DELETE FROM projects WHERE project_id = ?`,
            [projectId]
        );

        if (affectedRows === 0) {
            return NextResponse.json({ error: 'Project not found or already deleted' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: `Project with ID ${projectId} deleted successfully.` });

    } catch (error: unknown) {
        console.error(`Error deleting project ${projectId}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        // Check if projects are referenced (e.g., by test_benches)
        if (message.includes('foreign key constraint fails')) {
             return NextResponse.json(
                 { error: `Failed to delete project: It is still referenced by other records (e.g., Test Benches). Please update or remove associated records first.`, details: message },
                 { status: 400 }
             );
         }
        return NextResponse.json(
            { error: 'Failed to delete project', details: message },
            { status: 500 }
        );
    }
} 