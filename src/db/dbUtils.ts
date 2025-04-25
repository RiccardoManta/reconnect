import dotenv from 'dotenv';
import mysql, { Pool, PoolConnection, ResultSetHeader } from 'mysql2/promise';

dotenv.config(); // Load .env variables at the very beginning

// Database configuration - read from environment variables
const pool: Pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost', // Keep localhost default for direct script runs
  port: parseInt(process.env.MYSQL_PORT || '3306', 10), // Ensure port is a number
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10, // Adjust as needed
  queueLimit: 0,
});

// Test the connection pool
pool
  .getConnection()
  .then((connection) => {
    console.log('Successfully connected to MySQL database pool.');
    connection.release();
  })
  .catch((err) => {
    // Only log error, don't exit process during import
    console.error(
      '[dbUtils] Failed to connect to MySQL database pool on initial load:',
      err.code
    );
  });

// Execute a query with parameters and return results (array of rows)
// Define a generic type for query results, defaulting to RowDataPacket[]
export async function query<T extends mysql.RowDataPacket[]>(sql: string, params: any[] = []): Promise<T> {
  let connection: PoolConnection | null = null;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query<T>(sql, params);
    return rows;
  } catch (err) {
    console.error('Database query error:', err);
    throw err; // Re-throw the error to be handled by the caller
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Execute a query with parameters and return a single row
export async function queryOne<T extends mysql.RowDataPacket>(sql: string, params: any[] = []): Promise<T | null> {
  let connection: PoolConnection | null = null;
  try {
    // Apply the same explicit connection handling to queryOne for consistency
    connection = await pool.getConnection();
    const [rows] = await connection.query<T[]>(sql, params); // Query returns array
    const result = rows[0] || null;
    return result;
  } catch (err) {
    console.error('Database queryOne error:', err);
    throw err;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Execute an insert query and return the last inserted ID
export async function insert(sql: string, params: any[] = []): Promise<number | bigint> {
  try {
    const [result] = await pool.query<ResultSetHeader>(sql, params);
    return result.insertId;
  } catch (err) {
    console.error('Database insert error:', err);
    throw err;
  }
}

// Execute an update or delete query and return the number of affected rows
export async function update(sql: string, params: any[] = []): Promise<number> {
  try {
    const [result] = await pool.query<ResultSetHeader>(sql, params);
    return result.affectedRows;
  } catch (err) {
    console.error('Database update/delete error:', err);
    throw err;
  }
}

// Execute a query that doesn't need to return specific data (e.g., DDL)
export async function run(sql: string, params: any[] = []): Promise<void> {
  try {
    await pool.query(sql, params);
  } catch (err) {
    console.error('Database run error:', err);
    throw err;
  }
}

// Execute a transaction with multiple queries
// The callback should be an async function that accepts a PoolConnection
export async function transaction<T>(callback: (connection: PoolConnection) => Promise<T>): Promise<T> {
  let connection: PoolConnection | null = null;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (err) {
    if (connection) {
      await connection.rollback(); // Rollback on error
    }
    console.error('Database transaction error:', err);
    throw err; // Re-throw the error
  } finally {
    if (connection) {
      connection.release(); // Release the connection back to the pool
    }
  }
}

// Utility to close the pool - useful for graceful shutdown
export async function closePool(): Promise<void> {
  try {
    await pool.end();
    console.log('MySQL pool closed.');
  } catch (err) {
    console.error('Error closing MySQL pool:', err);
  }
}

// Export the pool itself if direct access is needed
export { pool }; 