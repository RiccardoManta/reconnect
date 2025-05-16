import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket } from 'mysql2/promise';
import { checkApiPermission } from '@/utils/server/permissionUtils';
import { Project as ProjectType, ProjectRequestBody } from '@/types/database';

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

// PUT method to update a project by ID
export async function PUT(request: NextRequest, context: any) {
    const { id } = context.params; // project_id
    // API Protection
    const permissionCheck = await checkApiPermission(request, ['Edit', 'Admin']);
    if (!permissionCheck.isAuthorized) {
        return permissionCheck.errorResponse!;
    }
    
    let requestBody: Partial<ProjectRequestBody> | null = null;

    try {
        requestBody = await request.json(); 
        if (!requestBody) { 
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }
        const body = requestBody;
        // project_id is from context.params.id
        // body might contain project_name, project_number for update.
        if (Object.keys(body).length === 0 || (body.project_name === undefined && body.project_number === undefined) ) {
             return NextResponse.json({ error: 'Request body is empty or missing fields for update' }, { status: 400 });
        }
        if (body.project_name !== undefined && body.project_name.trim() === ''){
            return NextResponse.json({ error: 'Project name cannot be empty.'}, {status: 400});
        }
        if (body.project_number !== undefined && body.project_number.trim() === ''){
            return NextResponse.json({ error: 'Project number cannot be empty.'}, {status: 400});
        }

        const fieldsToUpdate: string[] = [];
        const values: any[] = [];

        if (body.project_name !== undefined) { fieldsToUpdate.push('project_name = ?'); values.push(body.project_name); }
        if (body.project_number !== undefined) { fieldsToUpdate.push('project_number = ?'); values.push(body.project_number); }

        if (fieldsToUpdate.length === 0) {
            // This case should ideally be caught by the earlier check
            return NextResponse.json({ error: 'No valid fields provided for update' }, { status: 400 });
        }

        values.push(id); // For the WHERE project_id = ?

        const affectedRows = await dbUtils.update(
            `UPDATE projects SET ${fieldsToUpdate.join(', ')} WHERE project_id = ?`,
            values
        );

        if (affectedRows === 0) {
            const exists = await dbUtils.queryOne<ProjectType>('SELECT project_id FROM projects WHERE project_id = ?', [id]);
            if (!exists) {
                return NextResponse.json({ error: 'Project not found' }, { status: 404 });
            }
            return NextResponse.json({ message: 'No changes applied to Project', status: 'no_change' }, { status: 200 });
        }

        const updatedEntry = await dbUtils.queryOne<ProjectType>(
            `SELECT * FROM projects WHERE project_id = ?`,
            [id]
        );
        return NextResponse.json({ success: true, project: updatedEntry });

    } catch (error: unknown) {
        console.error(`Error updating Project ${id}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        // Add specific error handling if needed, e.g., for unique constraint violations on project_number
        if (message.toLowerCase().includes('duplicate entry')) {
             return NextResponse.json({ error: 'Failed to update project: Duplicate project number or name.', details: message }, { status: 409 }); // 409 Conflict
        }
        return NextResponse.json({ error: 'Failed to update Project' , details: message}, { status: 500 });
    }
}

// DELETE method to remove a project by ID
export async function DELETE(request: NextRequest, context: any): Promise<NextResponse> {
    const { id } = context.params; // project_id
    // API Protection
    const permissionCheck = await checkApiPermission(request, ['Admin', 'Edit']);
    if (!permissionCheck.isAuthorized) {
        return permissionCheck.errorResponse!;
    }
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