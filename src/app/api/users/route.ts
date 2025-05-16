import { NextRequest, NextResponse } from 'next/server';
import * as dbUtils from '@/db/dbUtils';
// Import the correct User type from @/types/database
import { User } from '@/types/database'; 
// ResultSetHeader is not directly used from dbUtils.insert which returns number | bigint

// Interface for POST/PUT request body
interface UserRequestBody {
    user_id?: number; // Only for PUT
    user_name: string;
    company_username?: string | null;
    email: string;
    user_group_id?: number | null; 
}

// GET method to fetch all users with their group and permission names
export async function GET(): Promise<NextResponse> {
  try {
    const users = await dbUtils.query<User[]>(
      `SELECT 
        u.user_id,
        u.user_name,
        u.company_username,
        u.email,
        u.user_group_id, 
        ug.user_group_name,
        p.permission_name
       FROM users u
       LEFT JOIN user_groups ug ON u.user_group_id = ug.user_group_id
       LEFT JOIN permissions p ON ug.permission_id = p.permission_id
       ORDER BY u.user_name`
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
    
    if (!body.user_name || !body.email) {
      return NextResponse.json(
        { error: 'User Name and Email are required' },
        { status: 400 }
      );
    }

    // dbUtils.insert returns the insertId directly as number | bigint
    const userId = await dbUtils.insert(
      `INSERT INTO users (user_name, company_username, email, user_group_id) 
       VALUES (?, ?, ?, ?)`,
      [
        body.user_name,
        body.company_username || null,
        body.email,
        body.user_group_id || null
      ]
    );

    if (typeof userId !== 'number' || userId <= 0) { // Check if userId is a valid number
        throw new Error("Failed to get valid user_id after insert.");
    }

    const newUser = await dbUtils.queryOne<User>(
      `SELECT 
        u.user_id,
        u.user_name,
        u.company_username,
        u.email,
        u.user_group_id, 
        ug.user_group_name,
        p.permission_name
       FROM users u
       LEFT JOIN user_groups ug ON u.user_group_id = ug.user_group_id
       LEFT JOIN permissions p ON ug.permission_id = p.permission_id
       WHERE u.user_id = ?`,
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

// PUT method to update an existing user (primarily for user details, group update will be separate)
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body: UserRequestBody = await request.json();
    
    if (body.user_id === undefined || body.user_id === null) {
      return NextResponse.json(
        { error: 'User ID (user_id) is required for update' },
        { status: 400 }
      );
    }
    
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (body.user_name !== undefined) {
        updateFields.push('user_name = ?');
        updateValues.push(body.user_name);
    }
    if (body.company_username !== undefined) {
        updateFields.push('company_username = ?');
        updateValues.push(body.company_username || null);
    }
    if (body.email !== undefined) {
        updateFields.push('email = ?');
        updateValues.push(body.email);
    }
    // user_group_id will be updated via a separate endpoint: /api/users/[id]/group
    // or if passed here, it should be explicitly handled:
    // if (body.user_group_id !== undefined) {
    //     updateFields.push('user_group_id = ?');
    //     updateValues.push(body.user_group_id);
    // }

    if (updateFields.length === 0) {
        const currentUser = await dbUtils.queryOne<User>(
           `SELECT u.user_id, u.user_name, u.company_username, u.email, u.user_group_id, ug.user_group_name, p.permission_name
            FROM users u
            LEFT JOIN user_groups ug ON u.user_group_id = ug.user_group_id
            LEFT JOIN permissions p ON ug.permission_id = p.permission_id
            WHERE u.user_id = ?`,
            [body.user_id]
        );
        return NextResponse.json({ 
            success: true, 
            message: 'No changes provided for user update.',
            user: currentUser
        });
    }

    updateValues.push(body.user_id); // Add user_id for the WHERE clause

    // dbUtils.update returns the number of affected rows
    const affectedRows = await dbUtils.update(
      `UPDATE users SET ${updateFields.join(', ')} WHERE user_id = ?`, 
      updateValues
    );
    
    // Type assertion for affectedRows if needed, or check based on dbUtils return type directly
    if (typeof affectedRows === 'number' && affectedRows === 0) {
      const existingUser = await dbUtils.queryOne<User>(
          `SELECT user_id FROM users WHERE user_id = ?`, 
          [body.user_id]
      );
      if (!existingUser) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      // If no rows affected but user exists, it means data was same, which is fine.
    }

    const updatedUser = await dbUtils.queryOne<User>(
        `SELECT 
            u.user_id,
            u.user_name,
            u.company_username,
            u.email,
            u.user_group_id, 
            ug.user_group_name,
            p.permission_name
         FROM users u
         LEFT JOIN user_groups ug ON u.user_group_id = ug.user_group_id
         LEFT JOIN permissions p ON ug.permission_id = p.permission_id
         WHERE u.user_id = ?`,
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