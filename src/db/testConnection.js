const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Database file path
const dbPath = path.join(__dirname, 'reconnect.db');
console.log(`Database path: ${dbPath}`);
console.log(`__dirname: ${__dirname}`);
console.log(`Absolute path: ${path.resolve(dbPath)}`);
console.log(`Database exists: ${fs.existsSync(dbPath)}`);

try {
  if (fs.existsSync(dbPath)) {
    const stats = fs.statSync(dbPath);
    console.log(`File permissions: ${stats.mode.toString(8)}`);
    console.log(`File size: ${stats.size} bytes`);
  }
  
  console.log('Opening database connection...');
  const db = new Database(dbPath);
  console.log('Connection successful!');
  
  console.log('Testing queries...');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Tables in database:', tables.map(t => t.name));
  
  const testBenches = db.prepare('SELECT * FROM test_benches').all();
  console.log(`Found ${testBenches.length} test benches.`);
  console.log('First test bench:', testBenches[0]);
  
  db.close();
  console.log('Database connection closed.');
} catch (err) {
  console.error('Error:', err);
} 