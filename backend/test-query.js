import db from './src/config/db.js';

async function run() {
  const students = await db.query('SELECT * FROM students');
  console.log('Students:', students.rows);
  const users = await db.query('SELECT id, name, email, school_id, is_active FROM users');
  console.log('Users:', users.rows);
  process.exit(0);
}
run();
