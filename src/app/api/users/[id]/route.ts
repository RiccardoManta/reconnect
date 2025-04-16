import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket } from 'mysql2/promise';

// Interface for User data (same as in parent route)
interface User extends RowDataPacket {
    user_id: number;
    user_name: string;
    contact_info: string | null;
}

// GET method to fetch a single user by ID
export async function GET(request: NextRequest, context: any): Promise<NextResponse> {
    // Assuming context structure { params: { id: string } }
    const id = context?.params?.id;
    if (typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid or missing user ID in params' }, { status: 400 });
    }
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
        return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    try {
        const user = await dbUtils.queryOne<User>(
            `SELECT * FROM users WHERE user_id = ?`,
            [userId]
        );

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ user });

    } catch (error: unknown) {
        console.error(`Error fetching user ${userId}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to fetch user', details: message },
            { status: 500 }
        );
    }
}

// DELETE method to remove a user by ID
export async function DELETE(request: NextRequest, context: any): Promise<NextResponse> {
    // Assuming context structure { params: { id: string } }
    const id = context?.params?.id;
    if (typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid or missing user ID in params' }, { status: 400 });
    }
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
        return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    try {
        // Use dbUtils.update for DELETE as it returns affectedRows
        const affectedRows = await dbUtils.update(
            `DELETE FROM users WHERE user_id = ?`,
            [userId]
        );

        if (affectedRows === 0) {
            return NextResponse.json({ error: 'User not found or already deleted' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: `User with ID ${userId} deleted successfully.` });

    } catch (error: unknown) {
        console.error(`Error deleting user ${userId}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        // Specific check for foreign key constraints (e.g., if test_benches references users)
        if (message.includes('foreign key constraint fails')) {
            return NextResponse.json(
                { error: `Failed to delete user: This user is still referenced by other records (e.g., Test Benches). Please update or remove associated records first.`, details: message },
                { status: 400 } // Bad request due to constraint violation
            );
        }
        return NextResponse.json(
            { error: 'Failed to delete user', details: message },
            { status: 500 }
        );
    }
} 