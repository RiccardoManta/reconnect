const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Database file path - use absolute path for Next.js
const dbPath = path.resolve(process.cwd(), 'src/db/reconnect.db');
console.log(`Database path configured as: ${dbPath}`);
console.log(`__dirname: ${__dirname}`);
console.log(`Process cwd: ${process.cwd()}`);
console.log(`Database exists: ${fs.existsSync(dbPath)}`);

// Create database connection
function getDbConnection() {
  try {
    console.log(`Attempting to connect to database at: ${dbPath}`);
    console.log(`Database exists: ${fs.existsSync(dbPath)}`);
    
    if (fs.existsSync(dbPath)) {
      try {
        const stats = fs.statSync(dbPath);
        console.log(`File permissions: ${stats.mode.toString(8)}`);
        console.log(`File size: ${stats.size} bytes`);
      } catch (statErr) {
        console.error('Error getting file stats:', statErr);
      }
    }
    
    const db = new Database(dbPath);
    db.pragma('foreign_keys = ON');
    return db;
  } catch (err) {
    console.error('Failed to connect to database:', err);
    throw err;
  }
}

// Execute a query with parameters and return results
function query(sql, params = []) {
  const db = getDbConnection();
  try {
    const stmt = db.prepare(sql);
    return stmt.all(params);
  } finally {
    db.close();
  }
}

// Execute a query with parameters and return a single row
function queryOne(sql, params = []) {
  const db = getDbConnection();
  try {
    const stmt = db.prepare(sql);
    return stmt.get(params);
  } finally {
    db.close();
  }
}

// Execute an insert query and return the last inserted ID
function insert(sql, params = []) {
  const db = getDbConnection();
  try {
    const stmt = db.prepare(sql);
    const result = stmt.run(params);
    return result.lastInsertRowid;
  } finally {
    db.close();
  }
}

// Execute an update query and return the number of affected rows
function update(sql, params = []) {
  const db = getDbConnection();
  try {
    const stmt = db.prepare(sql);
    const result = stmt.run(params);
    return result.changes;
  } finally {
    db.close();
  }
}

// Execute a transaction with multiple queries
function transaction(callback) {
  const db = getDbConnection();
  try {
    db.exec('BEGIN TRANSACTION');
    const result = callback(db);
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  } finally {
    db.close();
  }
}

// Execute a query that doesn't return any data (e.g., INSERT, UPDATE, DELETE)
function run(sql, params = []) {
  const db = getDbConnection();
  try {
    const stmt = db.prepare(sql);
    return stmt.run(params);
  } finally {
    db.close();
  }
}

module.exports = {
  getDbConnection,
  query,
  queryOne,
  insert,
  update,
  transaction,
  run
}; 