const { Client } = require('pg');
async function run() {
  const client = new Client('postgresql://postgres:1234@localhost:5432/student_erp');
  await client.connect();
  const res = await client.query('SELECT name, email, school_id FROM users');
  console.log(res.rows);
  const schools = await client.query('SELECT id, school_code FROM schools');
  console.log(schools.rows);
  await client.end();
}
run();
