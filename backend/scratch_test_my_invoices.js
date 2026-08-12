import pool from './src/config/db.js';

async function test() {
  const u = await pool.query("SELECT * FROM users WHERE email = 'student01@test.com'");
  const userId = u.rows[0].id;
  const uid = u.rows[0].uid;
  let studentRes = await pool.query(
    "SELECT s.id FROM students s WHERE s.user_id = $1 OR s.parent_id = $2 LIMIT 1",
    [userId, userId]
  );
  console.log('STUDENT MATCH:', studentRes.rows);
  if (studentRes.rows.length) {
    const studentId = studentRes.rows[0].id;
    const invRes = await pool.query(
      `SELECT fi.*, c.name as class_name, c.section,
              COALESCE((SELECT SUM(amount_paid) FROM fee_payments WHERE invoice_id=fi.id AND amount_paid > 0),0) as amount_paid
       FROM fee_invoices fi
       LEFT JOIN students s ON fi.student_id = s.id
       LEFT JOIN classes c ON s.class_id = c.id
       WHERE fi.student_id = $1
       ORDER BY fi.invoice_date DESC`,
      [studentId]
    );
    console.log('INVOICES:', invRes.rows);
  }
  process.exit(0);
}

test();
