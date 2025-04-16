const dotenv = require('dotenv');
const dbUtils = require('./dbUtils'); // Reverted to require
// Import specific types if needed, though query functions are generic now
// import { RowDataPacket } from 'mysql2'; 

dotenv.config(); // Load .env variables

// Define an async function to run the tests
async function testConnection() {
  console.log('Attempting to test MySQL connection using dbUtils...');

  try {
    // 1. Simple query test
    console.log('Testing simple query (SELECT 1+1)...');
    const result = await dbUtils.queryOne('SELECT 1+1 AS solution');
    if (result && result.solution === 2) {
      console.log('Simple query successful:', result);
    } else {
      console.error('Simple query failed or returned unexpected result:', result);
    }

    // 2. List tables
    console.log('Listing tables in the database...');
    const tablesResult = await dbUtils.query('SHOW TABLES;');
    const tableNames = tablesResult.map(row => Object.values(row)[0]);
    console.log('Tables found:', tableNames);

    // 3. Query a specific table (assuming test_benches exists)
    if (tableNames.includes('test_benches')) {
      console.log('Querying test_benches table...');
      const testBenches = await dbUtils.query('SELECT * FROM test_benches LIMIT 5');
      console.log(`Found ${testBenches.length} test benches (limit 5).`);
      if (testBenches.length > 0) {
          console.log('First test bench found:', testBenches[0]);
      }
    } else {
        console.log('Table test_benches not found yet.');
    }

  } catch (err) {
    console.error('Error during database connection test:', err);
  } finally {
    // 4. Close the pool
    console.log('Closing database pool...');
    await dbUtils.closePool();
    console.log('Pool closed.');
  }
}

// Run the async test function
testConnection(); 