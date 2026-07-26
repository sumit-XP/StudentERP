// Database migration script
// Run with: node migrate.js

import pool from './src/config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log('🚀 Running database migration...\n');

    const migrationPath = path.join(__dirname, 'src', 'config', 'migrate.sql');
    const migration = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Executing migration SQL...');
    await pool.query(migration);
    console.log('✅ Migration completed successfully!\n');

    // Verify
    const schools = await pool.query('SELECT id, name, is_active FROM schools');
    console.log('🏫 Schools in DB:', schools.rows);

    const roles = await pool.query('SELECT id, name FROM roles ORDER BY id');
    console.log('🎭 Roles in DB:', roles.rows);

    const cols = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'school_id'
    `);
    console.log('✅ users.school_id column exists:', cols.rows.length > 0);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await pool.end();
  }
}

runMigration().catch(console.error);
