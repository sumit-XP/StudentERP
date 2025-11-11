// Database setup script for School ERP System
// Run with: node setup.js

import pool from './src/config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDatabase() {
  try {
    console.log('🚀 Starting School ERP Database Setup...\n');

    // Read and execute schema file
    const schemaPath = path.join(__dirname, 'src', 'config', 'schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error('Schema file not found at: ' + schemaPath);
    }

    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📄 Executing database schema...');
    await pool.query(schema);
    console.log('✅ Database schema created successfully!');

    // Insert sample data
    console.log('\n📊 Inserting sample data...');
    
    // Create current academic year
    await pool.query(`
      INSERT INTO academic_years (year_name, start_date, end_date, is_current) 
      VALUES ('2024-2025', '2024-04-01', '2025-03-31', true)
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ Academic year created');

    // Create sample subjects
    const subjects = [
      ['Mathematics', 'MATH101', 'Basic Mathematics', 4],
      ['English', 'ENG101', 'English Language and Literature', 3],
      ['Science', 'SCI101', 'General Science', 4],
      ['Social Studies', 'SS101', 'Social Studies', 3],
      ['Computer Science', 'CS101', 'Introduction to Computer Science', 3]
    ];

    for (const [name, code, description, credits] of subjects) {
      await pool.query(
        'INSERT INTO subjects (name, code, description, credits) VALUES ($1, $2, $3, $4) ON CONFLICT (code) DO NOTHING',
        [name, code, description, credits]
      );
    }
    console.log('✅ Sample subjects created');

    // Create sample classes
    const classes = [
      ['Class 9A', 9, 'A', 1, 35],
      ['Class 9B', 9, 'B', 1, 35],
      ['Class 10A', 10, 'A', 1, 40],
      ['Class 10B', 10, 'B', 1, 40],
      ['Class 11A', 11, 'A', 1, 30],
      ['Class 12A', 12, 'A', 1, 30]
    ];

    for (const [name, grade, section, yearId, maxStudents] of classes) {
      await pool.query(
        'INSERT INTO classes (name, grade_level, section, academic_year_id, max_students) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
        [name, grade, section, yearId, maxStudents]
      );
    }
    console.log('✅ Sample classes created');

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Start the server: npm run dev');
    console.log('2. Test the API: node test-api.js');
    console.log('3. Register your first admin user via API');
    console.log('4. Set up Firebase service account key');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Make sure PostgreSQL is running');
    console.error('2. Check DATABASE_URL in .env file');
    console.error('3. Ensure database exists: createdb student_erp');
    console.error('4. Check database permissions');
  } finally {
    await pool.end();
  }
}

async function checkDatabaseConnection() {
  try {
    console.log('🔍 Checking database connection...');
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Database connected successfully!');
    console.log('📅 Current time:', result.rows[0].current_time);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function showDatabaseStats() {
  try {
    console.log('\n📊 Database Statistics:');
    
    const tables = [
      'users', 'roles', 'academic_years', 'classes', 'subjects', 
      'students', 'teachers', 'attendance', 'assignments', 
      'learning_resources', 'announcements', 'messages', 'notifications'
    ];
    
    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`📋 ${table}: ${result.rows[0].count} records`);
      } catch (error) {
        console.log(`📋 ${table}: Table not found or error`);
      }
    }
  } catch (error) {
    console.error('Error getting database stats:', error.message);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log('School ERP Database Setup Script\n');
    console.log('Usage:');
    console.log('  node setup.js              # Full database setup');
    console.log('  node setup.js --check      # Check database connection');
    console.log('  node setup.js --stats      # Show database statistics');
    console.log('  node setup.js --help       # Show this help');
    return;
  }
  
  if (args.includes('--check')) {
    const connected = await checkDatabaseConnection();
    if (connected) {
      await showDatabaseStats();
    }
    await pool.end();
    return;
  }
  
  if (args.includes('--stats')) {
    await showDatabaseStats();
    await pool.end();
    return;
  }
  
  // Default: full setup
  const connected = await checkDatabaseConnection();
  if (connected) {
    await setupDatabase();
  }
}

main().catch(console.error);
