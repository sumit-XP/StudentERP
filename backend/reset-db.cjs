const { Client } = require('pg');
const fs = require('fs');

async function resetDb() {
  const client = new Client({
    connectionString: 'postgresql://postgres:1234@localhost:5432/student_erp'
  });

  try {
    await client.connect();
    
    // Drop all tables
    await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    console.log('Database cleared.');

    // Run schema.sql
    const schemaSql = fs.readFileSync('src/config/schema.sql', 'utf8');
    await client.query(schemaSql);
    console.log('Schema applied.');
    
  } catch (err) {
    console.error('Error resetting DB:', err);
  } finally {
    await client.end();
  }
}

resetDb();
