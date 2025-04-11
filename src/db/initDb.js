const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// Database file path
const dbPath = path.join(__dirname, 'reconnect.db');

// Initialize database
function initializeDatabase() {
  let db;
  
  // Create new database if it doesn't exist
  try {
    console.log(`Creating/opening database at ${dbPath}`);
    db = new Database(dbPath);
    
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    
    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split schema into separate statements and execute
    console.log('Applying database schema...');
    
    // Execute schema as a transaction
    db.exec('BEGIN TRANSACTION;');
    db.exec(schema);
    db.exec('COMMIT;');
    
    console.log('Database initialization complete!');
    
    return db;
  } catch (err) {
    console.error('Database initialization failed:', err);
    if (db) db.close();
    throw err;
  }
}

// Run initialization if this script is executed directly
if (require.main === module) {
  const db = initializeDatabase();
  db.close();
  console.log('Database setup completed and connection closed.');
}

module.exports = { initializeDatabase }; 