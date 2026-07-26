import db from './src/config/db.js';
import admin from './src/config/firebase.js';

async function run() {
  try {
    // 1. Create a dummy user in Firebase
    let uid;
    try {
      const userRecord = await admin.auth().createUser({
        email: 'dummystudent@academy.com',
        password: 'Password123',
        displayName: 'Dummy Student'
      });
      uid = userRecord.uid;
    } catch (e) {
      if (e.code === 'auth/email-already-exists') {
        const u = await admin.auth().getUserByEmail('dummystudent@academy.com');
        uid = u.uid;
      } else throw e;
    }

    // 2. Insert into users
    const userRes = await db.query(
      `INSERT INTO users (firebase_uid, email, name, role_id, school_id, is_active)
       VALUES ($1, $2, $3, (SELECT id FROM roles WHERE name='student'), 2, true)
       ON CONFLICT (email) DO UPDATE SET is_active = true
       RETURNING id`,
       [uid, 'dummystudent@academy.com', 'Dummy Student']
    );
    const userId = userRes.rows[0].id;

    // 3. Insert into students
    // We need a class_id for school 2. Let's get the first one.
    const classRes = await db.query("SELECT id FROM classes WHERE school_id = 2 LIMIT 1");
    if (classRes.rows.length === 0) {
      console.log('No classes found for school 2');
      process.exit(1);
    }
    const classId = classRes.rows[0].id;

    await db.query(
      `INSERT INTO students (user_id, student_id, class_id, admission_date, roll_number, school_id)
       VALUES ($1, $2, $3, NOW(), 1, 2)
       ON CONFLICT (student_id) DO NOTHING`,
       [userId, 'DUMMY001', classId]
    );
    
    console.log('Dummy student created successfully!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}
run();
