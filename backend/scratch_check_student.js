import pool from './src/config/db.js';

async function test() {
  const u = await pool.query("SELECT * FROM users WHERE email = 'student01@test.com'");
  console.log('USER:', u.rows[0]);
  if (u.rows[0]) {
    const s = await pool.query("SELECT * FROM students WHERE user_id = $1", [u.rows[0].id]);
    console.log('STUDENT:', s.rows[0]);
    if (s.rows[0]) {
      const a = await pool.query("SELECT * FROM assignments WHERE class_id = $1", [s.rows[0].class_id]);
      console.log('ASSIGNMENTS FOR STUDENT CLASS:', a.rows);
    }
  }
  process.exit(0);
}

test();
