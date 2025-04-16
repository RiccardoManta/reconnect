import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket } from 'mysql2/promise';

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

// DELETE method to remove a model stand by ID
export async function DELETE(request: NextRequest, context: any): Promise<NextResponse> {
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