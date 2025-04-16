import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// Interface for User data returned by API
interface User extends RowDataPacket {
    user_id: number;
    user_name: string;
    contact_info: string | null;
}

// Interface for POST/PUT request body
interface UserRequestBody {
    user_id?: number; // Only for PUT
    user_name: string;
    contact_info?: string;
}

// GET method to fetch all users
export async function GET(): Promise<NextResponse> {
  try {
    const users = await dbUtils.query<User[]>(
      `SELECT * FROM users ORDER BY user_id`
    );
    
    return NextResponse.json({ users });

  } catch (error: unknown) {
    console.error('Error fetching users:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch users', details: message },
      { status: 500 }
    );
  }
}

// POST method to add a new user
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: UserRequestBody = await request.json();
    
    // Validate required fields
    if (!body.user_name) {
      return NextResponse.json(
        { error: 'User Name (user_name) is required' },
        { status: 400 }
      );
    }

    // Insert the new user record using dbUtils.insert
    const userId = await dbUtils.insert(
      `INSERT INTO users (user_name, contact_info) VALUES (?, ?)`, 
      [
        body.user_name,
        body.contact_info || null
      ]
    );

    if (!userId) {
        throw new Error("Failed to get user_id after insert.");
    }

    // Get the newly inserted record
    const newUser = await dbUtils.queryOne<User>(
      `SELECT * FROM users WHERE user_id = ?`,
      [userId]
    );
        
    return NextResponse.json({ 
      success: true, 
      message: 'User added successfully',
      user: newUser
    }, { status: 201 });
    
  } catch (error: unknown) {
    console.error('Error adding user:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to add user', details: message },
      { status: 500 }
    );
  }
}

// PUT method to update an existing user
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body: UserRequestBody = await request.json();
    
    // Validate required fields for PUT
    if (body.user_id === undefined || body.user_id === null) {
      return NextResponse.json(
        { error: 'User ID (user_id) is required for update' },
        { status: 400 }
      );
    }
    if (!body.user_name) {
      return NextResponse.json(
        { error: 'User Name (user_name) is required' },
        { status: 400 }
      );
    }

    // Update the user record using dbUtils.update
    const affectedRows = await dbUtils.update(
      `UPDATE users SET
         user_name = ?, 
         contact_info = ?
       WHERE user_id = ?`, 
      [
        body.user_name,
        body.contact_info || null,
        body.user_id
      ]
    );
    
    if (affectedRows === 0) {
        // Check if the record exists at all
      const existingUser = await dbUtils.queryOne(
          `SELECT user_id FROM users WHERE user_id = ?`, 
          [body.user_id]
      );
      if (!existingUser) {
          return NextResponse.json({ error: 'User record not found' }, { status: 404 });
       } else {
          // Record exists, but no changes made
          const updatedUser = await dbUtils.queryOne<User>(
            `SELECT * FROM users WHERE user_id = ?`,
            [body.user_id]
          );
          return NextResponse.json({ 
            success: true, 
            message: 'User update successful (no changes detected)',
            user: updatedUser
          });
       }
    }

    // Get the updated record
    const updatedUser = await dbUtils.queryOne<User>(
        `SELECT * FROM users WHERE user_id = ?`,
        [body.user_id]
    );
        
    return NextResponse.json({ 
      success: true, 
      message: 'User updated successfully',
      user: updatedUser
    });
    
  } catch (error: unknown) {
    console.error('Error updating user:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update user', details: message },
      { status: 500 }
    );
  }
} 