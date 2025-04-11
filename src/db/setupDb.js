#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { initializeDatabase } = require('./initDb');
const { seedDatabase } = require('./seedData');

console.log('==== SQLite Database Setup ====');

// Check if database already exists
const dbPath = path.join(__dirname, 'reconnect.db');
const dbExists = fs.existsSync(dbPath);

if (dbExists) {
  console.log(`Database already exists at ${dbPath}`);
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('Do you want to recreate the database? This will delete all existing data. (y/N): ', answer => {
    if (answer.toLowerCase() === 'y') {
      // Delete existing database
      try {
        fs.unlinkSync(dbPath);
        console.log('Existing database deleted.');
        createDatabase();
      } catch (err) {
        console.error('Failed to delete existing database:', err);
        process.exit(1);
      }
    } else {
      console.log('Database setup cancelled. Existing database remains unchanged.');
    }
    readline.close();
  });
} else {
  createDatabase();
}

function createDatabase() {
  try {
    // Initialize database with schema
    console.log('\nInitializing database with schema...');
    const db = initializeDatabase();
    db.close();

    // Seed with sample data
    console.log('\nSeeding database with sample data...');
    seedDatabase();

    console.log('\nDatabase setup completed successfully!');
    console.log(`Database location: ${dbPath}`);
    console.log('\nYou can now start the application and access the database.');
  } catch (err) {
    console.error('Error setting up database:', err);
    process.exit(1);
  }
} 