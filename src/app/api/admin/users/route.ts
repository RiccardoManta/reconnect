import { NextRequest, NextResponse } from 'next/server';
import { query, update, insert } from '@/db/dbUtils'; // Import update and insert functions
import { RowDataPacket } from 'mysql2/promise';
import bcrypt from 'bcrypt'; // Import bcrypt

// Interface for User data returned by GET
interface AdminUserResponse extends RowDataPacket {
  user_id: number;
  user_name: string;
  company_username: string | null;
  email: string;
  user_group_id: number | null; // Renamed from group_id
  user_group_name: string | null; // Renamed from group_name
}

// Interface for POST request body (New User)
interface CreateUserRequest {
  userName: string;
  companyUsername?: string | null;
  email: string;
  password?: string; // Make optional here, but validate presence in handler
  userGroupId: number | null;
}

// GET method
export async function GET() {
  try {
    // Join users with user_groups to get user_group_name
    const users = await query<AdminUserResponse[]>(`
      SELECT
        u.user_id,
        u.user_name,
        u.company_username,
        u.email,
        u.user_group_id,        -- Renamed column
        ug.user_group_name      -- Renamed column and table alias
      FROM users u
      LEFT JOIN user_groups ug ON u.user_group_id = ug.user_group_id -- Renamed table and columns
      ORDER BY u.user_name ASC
    `);

    // Ensure users is an array, even if empty
    const usersArray = Array.isArray(users) ? users : [];

    return NextResponse.json({ users: usersArray });
  } catch (error) {
    console.error('API Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users from database.' },
      { status: 500 }
    );
  }
}

// POST method to create a new user
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: CreateUserRequest = await request.json();
    const { userName, companyUsername, email, password, userGroupId } = body;

    // --- Input Validation ---
    if (!userName || !email || !password) {
      return NextResponse.json({ error: 'User Name, Email, and Password are required.' }, { status: 400 });
    }
    // Basic email format check (consider a more robust library for production)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format.' }, { status: 400 });
    }
    if (password.length < 8) { // Example: Enforce minimum password length
      return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400 });
    }
    // Validate userGroupId if provided
    if (userGroupId !== null && typeof userGroupId !== 'number') {
      return NextResponse.json({ error: 'User Group ID must be a number or null' }, { status: 400 });
    }

    // --- Check for existing email ---
    const existingUser = await query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (Array.isArray(existingUser) && existingUser.length > 0) {
      return NextResponse.json({ error: 'Email already in use.' }, { status: 409 }); // 409 Conflict
    }

    // --- Check if group exists (if userGroupId is provided) ---
    if (userGroupId !== null) {
      const groupExists = await query(
        'SELECT user_group_id FROM user_groups WHERE user_group_id = ?',
        [userGroupId]
      );
      if (!Array.isArray(groupExists) || groupExists.length === 0) {
        return NextResponse.json({ error: 'Selected Group not found.' }, { status: 404 });
      }
    }

    // --- Password Hashing ---
    const saltRounds = 10; // Recommended salt rounds
    const salt = await bcrypt.genSalt(saltRounds);
    const passwordHash = await bcrypt.hash(password, salt);

    // --- Database Insertion ---
    const newUserId = await insert(
      'INSERT INTO users (user_name, company_username, email, password_hash, salt, user_group_id) VALUES (?, ?, ?, ?, ?, ?)',
      [userName, companyUsername || null, email, passwordHash, salt, userGroupId]
    );

    if (newUserId) {
      // Fetch the newly created user data to return (optional, but good practice)
      const newUser = await query<AdminUserResponse[]>(`
        SELECT
          u.user_id, u.user_name, u.company_username, u.email,
          u.user_group_id, ug.user_group_name
        FROM users u
        LEFT JOIN user_groups ug ON u.user_group_id = ug.user_group_id
        WHERE u.user_id = ?
      `, [newUserId]);

      return NextResponse.json({
        success: true,
        message: 'User created successfully',
        user: newUser[0] || null // Return the created user data
      }, { status: 201 }); // 201 Created status
    } else {
      throw new Error('User creation succeeded but insertId was not returned or was zero.');
    }
  } catch (error: unknown) {
    console.error('API Error creating user:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    // Handle potential duplicate email errors during insert (race condition, though check exists)
    if (message.includes('Duplicate entry') && message.includes('for key \'users.email\'')) {
      return NextResponse.json({ error: 'Email already exists.', details: message }, { status: 409 });
    }
    // Handle potential foreign key errors during insert (e.g., invalid group id)
    if (message.includes('foreign key constraint fails')) {
      return NextResponse.json({ error: 'Invalid User Group ID provided.', details: message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to create user.', details: message },
      { status: 500 }
    );
  }
}

// Interface for PUT request body
interface UpdateUserGroupRequest {
    userId: number;
    userGroupId: number | null; // Renamed from groupId, can be null to remove group assignment
}

// PUT method to update user group
export async function PUT(request: NextRequest): Promise<NextResponse> {
    try {
        const body: UpdateUserGroupRequest = await request.json();

        // Validate input
        if (body.userId === undefined || body.userId === null) {
            return NextResponse.json({ error: 'User ID (userId) is required' }, { status: 400 });
        }
        // userGroupId can be null, so only check type if not null
        if (body.userGroupId !== null && typeof body.userGroupId !== 'number') {
             return NextResponse.json({ error: 'User Group ID (userGroupId) must be a number or null' }, { status: 400 });
        }

        // Check if user exists
        const userExists = await query(
            'SELECT user_id FROM users WHERE user_id = ?',
            [body.userId]
        );
        if (!Array.isArray(userExists) || userExists.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if group exists (if userGroupId is not null)
        if (body.userGroupId !== null) {
            const groupExists = await query(
                'SELECT user_group_id FROM user_groups WHERE user_group_id = ?', // Use new table/column name
                [body.userGroupId]
            );
            if (!Array.isArray(groupExists) || groupExists.length === 0) {
                return NextResponse.json({ error: 'Group not found' }, { status: 404 });
            }
        }

        // Perform the update
        const affectedRows = await update(
            'UPDATE users SET user_group_id = ? WHERE user_id = ?', // Use new column name
            [body.userGroupId, body.userId]
        );

        if (affectedRows === 0) {
            // This might happen if the user exists but wasn't updated (e.g., already had that user_group_id)
            // Or potentially a race condition where the user was deleted between check and update.
            // For simplicity, we can treat it as success if the user exists, but log a warning.
            console.warn(`User ${body.userId} group update affected 0 rows, but user exists.`);
        }

        // Fetch the updated user data to return
        const updatedUser = await query<AdminUserResponse[]>(`
            SELECT
                u.user_id, u.user_name, u.company_username, u.email,
                u.user_group_id, ug.user_group_name  -- Use new names
            FROM users u
            LEFT JOIN user_groups ug ON u.user_group_id = ug.user_group_id -- Use new names
            WHERE u.user_id = ?
        `, [body.userId]);

        return NextResponse.json({
            success: true,
            message: 'User group updated successfully',
            user: updatedUser[0] || null // Return the updated user data
        });

    } catch (error: unknown) {
        console.error('API Error updating user group:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        // Handle potential foreign key errors during update
        if (message.includes('foreign key constraint fails')) {
             return NextResponse.json({ error: 'Failed to update user group: Invalid User Group ID.', details: message }, { status: 400 }); // Updated error message
        }
        return NextResponse.json(
            { error: 'Failed to update user group.', details: message },
            { status: 500 }
        );
    }
} 