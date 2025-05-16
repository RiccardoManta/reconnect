import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket } from 'mysql2/promise';
import { checkApiPermission } from '@/utils/server/permissionUtils';
import { ModelStand as ModelStandType, ModelStandRequestBody } from '@/types/database';

// Interface for Model Stand data (same as in parent route)
interface ModelStand extends RowDataPacket {
    model_id: number;
    model_name: string;
    svn_link: string | null;
    features: string | null;
}

// GET method to fetch a single model stand by ID
export async function GET(request: NextRequest, context: any): Promise<NextResponse> {
    // Assuming context structure { params: { id: string } }
    const id = context?.params?.id;
    if (typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid or missing model ID in params' }, { status: 400 });
    }
    const modelId = parseInt(id, 10);

    if (isNaN(modelId)) {
        return NextResponse.json({ error: 'Invalid model ID format' }, { status: 400 });
    }

    try {
        const modelStand = await dbUtils.queryOne<ModelStand>(
            `SELECT * FROM model_stands WHERE model_id = ?`,
            [modelId]
        );

        if (!modelStand) {
            return NextResponse.json({ error: 'Model stand not found' }, { status: 404 });
        }

        return NextResponse.json({ modelStand });

    } catch (error: unknown) {
        console.error(`Error fetching model stand ${modelId}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to fetch model stand', details: message },
            { status: 500 }
        );
    }
}

// PUT method to update an existing model stand by ID
export async function PUT(request: NextRequest, context: any): Promise<NextResponse> {
    const permissionCheck = await checkApiPermission(request, ['Edit', 'Admin']);
    if (!permissionCheck.isAuthorized) {
        return permissionCheck.errorResponse!;
    }

    const id = context?.params?.id;
    if (typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid or missing model ID in params' }, { status: 400 });
    }
    const modelId = parseInt(id, 10);

    if (isNaN(modelId)) {
        return NextResponse.json({ error: 'Invalid model ID format' }, { status: 400 });
    }

    try {
        const body: Partial<ModelStandRequestBody> = await request.json();

        // Basic validation: ensure at least one updatable field is present
        if (Object.keys(body).length === 0) {
            return NextResponse.json({ error: 'Request body is empty or contains no updatable fields' }, { status: 400 });
        }
        if (body.model_name !== undefined && (typeof body.model_name !== 'string' || body.model_name.trim() === '')) {
            return NextResponse.json({ error: 'Model name cannot be empty' }, { status: 400 });
        }

        // Construct SET clause dynamically based on provided fields
        const fieldsToUpdate: string[] = [];
        const values: any[] = [];

        if (body.model_name !== undefined) { fieldsToUpdate.push('model_name = ?'); values.push(body.model_name); }
        if (body.svn_link !== undefined) { fieldsToUpdate.push('svn_link = ?'); values.push(body.svn_link); }
        if (body.features !== undefined) { fieldsToUpdate.push('features = ?'); values.push(body.features); }

        if (fieldsToUpdate.length === 0) {
            return NextResponse.json({ error: 'No valid fields provided for update' }, { status: 400 });
        }

        values.push(modelId); // For the WHERE clause

        const affectedRows = await dbUtils.update(
            `UPDATE model_stands SET ${fieldsToUpdate.join(', ')} WHERE model_id = ?`,
            values
        );

        if (affectedRows === 0) {
            return NextResponse.json({ error: 'Model stand not found or no changes made' }, { status: 404 });
        }

        // Fetch the updated record to return it
        const updatedModelStand = await dbUtils.queryOne<ModelStandType>(
            'SELECT * FROM model_stands WHERE model_id = ?',
            [modelId]
        );

        return NextResponse.json({ success: true, model_stand: updatedModelStand });

    } catch (error: unknown) {
        console.error(`Error updating model stand ${modelId}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to update model stand', details: message },
            { status: 500 }
        );
    }
}

// DELETE method to remove a model stand by ID
export async function DELETE(request: NextRequest, context: any): Promise<NextResponse> {
    // API Protection
    const permissionCheck = await checkApiPermission(request, ['Admin', 'Edit']);
    if (!permissionCheck.isAuthorized) {
        return permissionCheck.errorResponse!;
    }

    // Assuming context structure { params: { id: string } }
    const id = context?.params?.id;
    if (typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid or missing model ID in params' }, { status: 400 });
    }
    const modelId = parseInt(id, 10);

    if (isNaN(modelId)) {
        return NextResponse.json({ error: 'Invalid model ID format' }, { status: 400 });
    }

    try {
        const affectedRows = await dbUtils.update(
            `DELETE FROM model_stands WHERE model_id = ?`,
            [modelId]
        );

        if (affectedRows === 0) {
            return NextResponse.json({ error: 'Model stand not found or already deleted' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: `Model stand with ID ${modelId} deleted successfully.` });

    } catch (error: unknown) {
        console.error(`Error deleting model stand ${modelId}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        // Add foreign key constraint check if model_stands are referenced elsewhere
        if (message.includes('foreign key constraint fails')) {
             return NextResponse.json(
                 { error: `Failed to delete model stand: It is still referenced by other records.`, details: message },
                 { status: 400 }
             );
         }
        return NextResponse.json(
            { error: 'Failed to delete model stand', details: message },
            { status: 500 }
        );
    }
} 