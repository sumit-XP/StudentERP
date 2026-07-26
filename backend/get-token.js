import db from './src/config/db.js';
import admin from './src/config/firebase.js';

async function run() {
  const users = await db.query("SELECT firebase_uid FROM users WHERE email='testadmin@academy.com'");
  const token = await admin.auth().createCustomToken(users.rows[0].firebase_uid);
  console.log('Token:', token);
  process.exit(0);
}
run();
