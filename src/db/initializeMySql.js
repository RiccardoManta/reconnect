const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') }); // Load .env from project root

const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'reconnect_db',
  port: process.env.MYSQL_PORT || 3306,
  multipleStatements: true, // Allow multiple statements for running SQL files
};

const schemaSqlPath = path.join(__dirname, 'schema.sql');
const seedSqlPath = path.join(__dirname, 'seed.sql');

async function executeSqlFile(connection, filePath, fileName) {
  console.log(`Reading ${fileName} from ${filePath}...`);
  let sql = fs.readFileSync(filePath, 'utf-8');
  
  // 1. Remove block comments (/* ... */) and line comments (-- ...)
  sql = sql.replace(/\/\*[\s\S]*?\*\//g, ''); // Remove block comments with corrected regex
  sql = sql.replace(/--.*$/gm, '');          // Remove single-line comments (this one is usually fine)
  sql = sql.replace(/^\s*\n/gm, '');         // Remove empty lines that might result from comment removal (corrected regex)

  const statements = [];
  let effectiveDelimiter = ';';
  let currentStatementBuffer = '';

  // Split the entire SQL script by lines to process it sequentially
  const lines = sql.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine.toUpperCase().startsWith('DELIMITER ')) {
      // Process any statement accumulated with the old delimiter
      if (currentStatementBuffer.trim().length > 0) {
        currentStatementBuffer.split(effectiveDelimiter).forEach(part => {
          const stmt = part.trim();
          if (stmt.length > 0) {
            statements.push(stmt);
          }
        });
      }
      currentStatementBuffer = ''; // Reset buffer
      effectiveDelimiter = trimmedLine.substring('DELIMITER '.length).trim();
      // The DELIMITER command itself is not sent to the server
      continue;
    }

    currentStatementBuffer += line + '\n';

    if (currentStatementBuffer.trimRight().endsWith(effectiveDelimiter)) {
      const parts = currentStatementBuffer.trimRight().split(effectiveDelimiter);
      
      for (let i = 0; i < parts.length; i++) {
        const stmtPart = parts[i].trim();
        if (stmtPart.length > 0) {
          statements.push(stmtPart);
        }
      }
      currentStatementBuffer = ''; // Clear buffer after processing
    }
  }

  if (currentStatementBuffer.trim().length > 0) {
    currentStatementBuffer.split(effectiveDelimiter).forEach(part => {
        const stmt = part.trim();
        if (stmt.length > 0) {
          statements.push(stmt);
        }
      });
  }
  
  console.log(`Executing statements from ${fileName} (found ${statements.length} statements after parsing delimiters)...`);
  for (const statement of statements) {
    if (statement.length === 0) continue; 
    try {
      await connection.query(statement);
    } catch (error) {
      console.error(`Error executing statement from ${fileName}: ${statement.substring(0, 150)}...`);
      console.error(`SQL Error: ${error.message}`);
      console.error(`SQL State: ${error.sqlState}`);
      console.error(`Error Code: ${error.errno}`);
      if (statement.length < 1000) {
          console.error(`Full problematic statement:\n${statement}`);
      }
      throw error;
    }
  }
  console.log(`${fileName} executed successfully.`);
}

async function initializeDatabase() {
  let connection;
  try {
    // Connect without specifying a database first, to be able to create it if it doesn't exist
    console.log(`Connecting to MySQL server at ${dbConfig.host}:${dbConfig.port} as user ${dbConfig.user}...`);
    connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: parseInt(dbConfig.port, 10),
      multipleStatements: true, // Important for SQL script execution
    });
    console.log('Connected to MySQL server.');

    console.log(`Dropping database ${dbConfig.database} if it exists...`);
    await connection.query(`DROP DATABASE IF EXISTS ${dbConfig.database}`);
    console.log(`Database ${dbConfig.database} dropped (if existed).`);

    console.log(`Creating database ${dbConfig.database}...`);
    await connection.query(`CREATE DATABASE ${dbConfig.database}`);
    console.log(`Database ${dbConfig.database} created.`);

    // Reconnect, this time to the specific database
    await connection.changeUser({ database: dbConfig.database });
    console.log(`Switched to database ${dbConfig.database}.`);

    try {
      console.log('Attempting to set SESSION log_bin_trust_function_creators = 1...');
      await connection.query('SET SESSION log_bin_trust_function_creators = 1;');
      console.log('SESSION log_bin_trust_function_creators set to 1.');
    } catch (sessionError) {
      console.warn(`Warning: Could not set SESSION log_bin_trust_function_creators = 1. Error: ${sessionError.message}`);
      console.warn('Proceeding with schema execution. If trigger creation fails, this might be the cause.');
    }

    // Execute Schema SQL
    await executeSqlFile(connection, schemaSqlPath, 'schema.sql');

    // Execute Seed SQL
    await executeSqlFile(connection, seedSqlPath, 'seed.sql');

    console.log('\nDatabase setup and seeding completed successfully!');

  } catch (error) {
    console.error('\nAn error occurred during database setup:');
    // Print more details for any error, especially connection errors
    console.error(`Error Code: ${error.code}`);
    console.error(`Error Number: ${error.errno}`);
    console.error(`Syscall: ${error.syscall}`);
    console.error(`Address: ${error.address}`);
    console.error(`Port: ${error.port}`);
    console.error(`Message: ${error.message}`);
    if (error.sqlState) { // If it's a specific SQL execution error from executeSqlFile
        console.error(`SQL State: ${error.sqlState}`);
        console.error(`SQL Message: ${error.sqlMessage}`);
    }
    process.exitCode = 1; // Indicate failure
  } finally {
    if (connection) {
      console.log('Closing database connection...');
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

initializeDatabase(); 