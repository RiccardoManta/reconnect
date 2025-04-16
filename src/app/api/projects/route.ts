import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// Interface for Project data returned by API
interface Project extends RowDataPacket {
    project_id: number;
    project_number: string | null;
    project_name: string;
}

// Interface for POST/PUT request body
interface ProjectRequestBody {
    project_id?: number; // Only for PUT
    project_number?: string;
    project_name: string;
}

// GET method to fetch all projects
export async function GET(): Promise<NextResponse> {
  try {
    const projects = await dbUtils.query<Project[]>(
      `SELECT * FROM projects ORDER BY project_id`
    );
    
    return NextResponse.json({ projects });

  } catch (error: unknown) {
    console.error('Error fetching projects:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch projects', details: message },
      { status: 500 }
    );
  }
}

// POST method to add a new project
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: ProjectRequestBody = await request.json();
    
    // Validate required fields
    if (!body.project_name) {
      return NextResponse.json(
        { error: 'Project Name (project_name) is required' },
        { status: 400 }
      );
    }

    // Insert the new project record using dbUtils.insert
    const projectId = await dbUtils.insert(
      `INSERT INTO projects (project_number, project_name) VALUES (?, ?)`, 
      [
        body.project_number || null,
        body.project_name
      ]
    );

    if (!projectId) {
        throw new Error("Failed to get project_id after insert.");
    }

    // Get the newly inserted record
    const newProject = await dbUtils.queryOne<Project>(
      `SELECT * FROM projects WHERE project_id = ?`,
      [projectId]
    );
        
    return NextResponse.json({ 
      success: true, 
      message: 'Project added successfully',
      project: newProject
    }, { status: 201 });
    
  } catch (error: unknown) {
    console.error('Error adding project:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to add project', details: message },
      { status: 500 }
    );
  }
}

// PUT method to update an existing project
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body: ProjectRequestBody = await request.json();
    
    // Validate required fields for PUT
    if (body.project_id === undefined || body.project_id === null) {
      return NextResponse.json(
        { error: 'Project ID (project_id) is required for update' },
        { status: 400 }
      );
    }
    if (!body.project_name) {
      return NextResponse.json(
        { error: 'Project Name (project_name) is required' },
        { status: 400 }
      );
    }

    // Update the project record using dbUtils.update
    const affectedRows = await dbUtils.update(
      `UPDATE projects SET
         project_number = ?, 
         project_name = ?
       WHERE project_id = ?`, 
      [
        body.project_number || null,
        body.project_name,
        body.project_id
      ]
    );
    
    if (affectedRows === 0) {
        // Check if the record exists at all
      const existingProject = await dbUtils.queryOne(
          `SELECT project_id FROM projects WHERE project_id = ?`, 
          [body.project_id]
      );
       if (!existingProject) {
           return NextResponse.json({ error: 'Project record not found' }, { status: 404 });
        } else {
          // Record exists, but no changes made
           const updatedProject = await dbUtils.queryOne<Project>(
            `SELECT * FROM projects WHERE project_id = ?`,
            [body.project_id]
           );
           return NextResponse.json({ 
             success: true, 
             message: 'Project update successful (no changes detected)',
             project: updatedProject
           });
        }
    }

    // Get the updated record
    const updatedProject = await dbUtils.queryOne<Project>(
        `SELECT * FROM projects WHERE project_id = ?`,
        [body.project_id]
    );
        
    return NextResponse.json({ 
      success: true, 
      message: 'Project updated successfully',
      project: updatedProject
    });
    
  } catch (error: unknown) {
    console.error('Error updating project:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update project', details: message },
      { status: 500 }
    );
  }
} 