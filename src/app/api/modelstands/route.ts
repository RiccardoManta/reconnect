import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// Interface for Model Stand data returned by API
interface ModelStand extends RowDataPacket {
    model_id: number;
    model_name: string;
    svn_link: string | null;
    features: string | null;
}

// Interface for POST/PUT request body
interface ModelStandRequestBody {
    model_id?: number; // Only for PUT
    model_name: string;
    svn_link?: string;
    features?: string;
}

// GET method to fetch all model stands
export async function GET(): Promise<NextResponse> {
  try {
    const modelStands = await dbUtils.query<ModelStand[]>(
      `SELECT * FROM model_stands ORDER BY model_id`
    );
    
    return NextResponse.json({ modelStands });

  } catch (error: unknown) {
    console.error('Error fetching model stands:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch model stands', details: message },
      { status: 500 }
    );
  }
}

// POST method to add a new model stand
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: ModelStandRequestBody = await request.json();
    
    // Validate required fields
    if (!body.model_name) {
      return NextResponse.json(
        { error: 'Model Name (model_name) is required' },
        { status: 400 }
      );
    }

    // Insert the new model stand record using dbUtils.insert
    const modelId = await dbUtils.insert(
      `INSERT INTO model_stands (model_name, svn_link, features) VALUES (?, ?, ?)`, 
      [
        body.model_name,
        body.svn_link || null,
        body.features || null
      ]
    );

    if (!modelId) {
        throw new Error("Failed to get model_id after insert.");
    }

    // Get the newly inserted record
    const newModelStand = await dbUtils.queryOne<ModelStand>(
      `SELECT * FROM model_stands WHERE model_id = ?`,
      [modelId]
    );
        
    return NextResponse.json({ 
      success: true, 
      message: 'Model stand added successfully',
      modelStand: newModelStand
    }, { status: 201 });
    
  } catch (error: unknown) {
    console.error('Error adding model stand:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to add model stand', details: message },
      { status: 500 }
    );
  }
}

// PUT method to update an existing model stand
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body: ModelStandRequestBody = await request.json();
    
    // Validate required fields for PUT
    if (!body.model_id) {
      return NextResponse.json(
        { error: 'Model ID (model_id) is required for update' },
        { status: 400 }
      );
    }
    if (!body.model_name) {
      return NextResponse.json(
        { error: 'Model Name (model_name) is required' },
        { status: 400 }
      );
    }

    // Update the model stand record using dbUtils.update
    const affectedRows = await dbUtils.update(
      `UPDATE model_stands SET
         model_name = ?, 
         svn_link = ?, 
         features = ?
       WHERE model_id = ?`, 
      [
        body.model_name,
        body.svn_link || null,
        body.features || null,
        body.model_id
      ]
    );
    
    if (affectedRows === 0) {
      return NextResponse.json(
        { error: 'Model stand record not found or no changes made' },
        { status: 404 }
      );
    }

    // Get the updated record
    const updatedModelStand = await dbUtils.queryOne<ModelStand>(
        `SELECT * FROM model_stands WHERE model_id = ?`,
        [body.model_id]
    );
        
    return NextResponse.json({ 
      success: true, 
      message: 'Model stand updated successfully',
      modelStand: updatedModelStand
    });
    
  } catch (error: unknown) {
    console.error('Error updating model stand:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update model stand', details: message },
      { status: 500 }
    );
  }
} 