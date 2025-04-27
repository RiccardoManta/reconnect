import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
import { queryOne, insert } from '../../src/db/dbUtils'; // Adjust path if needed
import { RowDataPacket } from 'mysql2/promise';

// Define a type for user row (using user_id)
interface UserCheck extends RowDataPacket {
  user_id: number; // Use user_id
  email: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { email, password } = req.body;

    // Add more robust validation as needed
    if (!email || !password || !email.includes('@') || password.trim().length < 8) {
      return res.status(400).json({ message: 'Invalid input - email and password (min 8 chars) are required.' });
    }

    // --- Check if user exists using email ---
    const existingUser = await queryOne<UserCheck>(
      'SELECT user_id, email FROM users WHERE email = ?', // Use user_id
       [email]
    );

    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with this email.' });
    }

    // --- Password Hashing ---
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // --- Generate default username from email --- 
    const userName = email.split('@')[0]; // Take part before @

    // --- Store User in Database ---
    // Include the generated user_name in the insert
    const insertSql = 'INSERT INTO users (email, password_hash, salt, user_name) VALUES (?, ?, ?, ?)';
    const insertId = await insert(insertSql, [email, hashedPassword, salt, userName]);

    console.log(`Signup API: User created with ID: ${insertId}, UserName: ${userName}`);

    // Return success - user will still need to login separately via next-auth
    return res.status(201).json({ message: 'User created successfully! Please log in.' });

  } catch (error) {
    console.error('Signup API error:', error);
    return res.status(500).json({ message: 'Internal server error during signup.' });
  }
}

export default handler; 