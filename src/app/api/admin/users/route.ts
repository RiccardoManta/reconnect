import { NextRequest, NextResponse } from 'next/server';
import { query, update, insert } from '@/db/dbUtils'; // Import update and insert functions
import { RowDataPacket } from 'mysql2/promise';
import bcrypt from 'bcrypt'; // Import bcrypt
import { getServerSession } from "next-auth/next"; // Import getServerSession
import { authOptions } from '@/lib/authOptions'; // Import from the re-exporting file
import { getUserPermissions } from '@/utils/server/permissionUtils'; // Import permission utility

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
  user_name: string;
  company_username?: string | null;
  email: string;
  password?: string; // Make optional here, but validate presence in handler
  user_group_id: number | null;
}

// Interface for PUT request body
interface UpdateUserGroupRequest {
    user_id: number;
    user_group_id: number | null; 
}

// Helper function for admin check
async function checkAdminPermission(request: NextRequest): Promise<{ isAdmin: boolean; errorResponse?: NextResponse }> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return { isAdmin: false, errorResponse: NextResponse.json({ error: 'Unauthorized: Not logged in' }, { status: 401 }) };
    }
    const userId = parseInt(session.user.id, 10);
    if (isNaN(userId)) {
         return { isAdmin: false, errorResponse: NextResponse.json({ error: 'Unauthorized: Invalid user ID in session' }, { status: 401 }) };
    }
    const { permissionName } = await getUserPermissions(userId);
    if (permissionName !== 'Admin') {
        return { isAdmin: false, errorResponse: NextResponse.json({ error: 'Forbidden: Requires Admin privileges' }, { status: 403 }) };
    }
    return { isAdmin: true };
}

// GET method
export async function GET(request: NextRequest) {
    const permissionCheck = await checkAdminPermission(request);
    if (!permissionCheck.isAdmin) {
        return permissionCheck.errorResponse;
    }

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
    const permissionCheck = await checkAdminPermission(request);
    if (!permissionCheck.isAdmin) {
        return permissionCheck.errorResponse!;
    }

    try {
        const body: CreateUserRequest = await request.json();
        const { user_name, company_username, email, password, user_group_id } = body;

        // --- Input Validation ---
        if (!user_name || !email || !password) {
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
        if (user_group_id !== null && typeof user_group_id !== 'number') {
            return NextResponse.json({ error: 'User Group ID must be a number or null' }, { status: 400 });
        }

        // --- Check for existing email ---
        const existingUser = await query('SELECT user_id FROM users WHERE email = ?', [email]);
        if (Array.isArray(existingUser) && existingUser.length > 0) {
            return NextResponse.json({ error: 'Email already in use.' }, { status: 409 }); // 409 Conflict
        }

        // --- Check if group exists (if userGroupId is provided) ---
        if (user_group_id !== null) {
            const groupExists = await query(
                'SELECT user_group_id FROM user_groups WHERE user_group_id = ?',
                [user_group_id]
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
            [user_name, company_username || null, email, passwordHash, salt, user_group_id]
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

// PUT method to update user group
export async function PUT(request: NextRequest): Promise<NextResponse> {
    const permissionCheck = await checkAdminPermission(request);
    if (!permissionCheck.isAdmin) {
        return permissionCheck.errorResponse!;
    }

    try {
        const body: UpdateUserGroupRequest = await request.json();
        const { user_id, user_group_id } = body; // Destructure snake_case

        // Validate input
        if (user_id === undefined || user_id === null) {
            return NextResponse.json({ error: 'User ID (user_id) is required' }, { status: 400 });
        }
        // user_group_id can be null, so only check type if not null
        if (user_group_id !== null && typeof user_group_id !== 'number') {
             return NextResponse.json({ error: 'User Group ID (user_group_id) must be a number or null' }, { status: 400 });
        }

        // Check if user exists
        const userExists = await query(
            'SELECT user_id FROM users WHERE user_id = ?',
            [user_id]
        );
        if (!Array.isArray(userExists) || userExists.length === 0) {
            return NextResponse.json({ error: 'User not found.' }, { status: 404 });
        }

        // Check if group exists (if user_group_id is not null)
        if (user_group_id !== null) {
            const groupExists = await query(
                'SELECT user_group_id FROM user_groups WHERE user_group_id = ?',
                [user_group_id]
            );
            if (!Array.isArray(groupExists) || groupExists.length === 0) {
                return NextResponse.json({ error: 'Selected Group not found.' }, { status: 404 });
            }
        }

        // --- Database Update ---
        const affectedRows = await update(
            'UPDATE users SET user_group_id = ? WHERE user_id = ?',
            [user_group_id, user_id]
        );

        if (affectedRows > 0) {
            // Fetch the updated user data to return
            const updatedUser = await query<AdminUserResponse[]>(`
                SELECT
                    u.user_id, u.user_name, u.company_username, u.email,
                    u.user_group_id, ug.user_group_name
                FROM users u
                LEFT JOIN user_groups ug ON u.user_group_id = ug.user_group_id
                WHERE u.user_id = ?
            `, [user_id]);

            return NextResponse.json({
                success: true,
                message: 'User group updated successfully',
                user: updatedUser[0] || null // Return the updated user data
            });
        } else {
            // This case could mean user_id not found, or group was already set to this value
            // For simplicity, returning a generic message. Could check if user existed before update for more specific error.
            const userStillExists = await query('SELECT user_id FROM users WHERE user_id = ?', [user_id]);
            if (!Array.isArray(userStillExists) || userStillExists.length === 0) {
                 return NextResponse.json({ error: 'User not found during update attempt.' }, { status: 404 });
            }
            // If user exists but affectedRows is 0, it means the value was already the same.
            // Fetch current state to return.
            const currentUserData = await query<AdminUserResponse[]>(`
                SELECT
                    u.user_id, u.user_name, u.company_username, u.email,
                    u.user_group_id, ug.user_group_name
                FROM users u
                LEFT JOIN user_groups ug ON u.user_group_id = ug.user_group_id
                WHERE u.user_id = ?
            `, [user_id]);
            return NextResponse.json({
                success: true,
                message: 'User group unchanged or update failed to modify rows.',
                user: currentUserData[0] || null
            });
        }
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