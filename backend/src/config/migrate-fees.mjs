// Migration script: add missing columns for fee system overhaul
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });


const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const migrations = [
  // Phase 1 migrations: add school_id to fee_structure and fee_invoices, add remarks/collected_by to fee_payments
  `ALTER TABLE fee_structure ADD COLUMN IF NOT EXISTS school_id UUID`,
  `ALTER TABLE fee_invoices ADD COLUMN IF NOT EXISTS school_id UUID`,
  `ALTER TABLE fee_payments ADD COLUMN IF NOT EXISTS remarks TEXT`,
  `ALTER TABLE fee_payments ADD COLUMN IF NOT EXISTS collected_by VARCHAR(255)`,
];

async function run() {
  const client = await pool.connect();
  try {
    console.log('Running fee system migrations...');
    for (const sql of migrations) {
      await client.query(sql);
      console.log('✅', sql.slice(0, 60));
    }
    console.log('\n✅ All migrations completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
