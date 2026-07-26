import axios from 'axios';
import db from './src/config/db.js';
import admin from './src/config/firebase.js';

async function run() {
  try {
    const users = await db.query("SELECT firebase_uid FROM users WHERE email='testadmin@academy.com'");
    if (users.rows.length === 0) {
       console.log('No user found');
       process.exit(1);
    }
    const token = await admin.auth().createCustomToken(users.rows[0].firebase_uid);
    console.log('Got token, making request...');

    // Wait, the Firebase SDK provides ID tokens to the client when they login.
    // However, our backend /api/auth/register uses `verifyToken` middleware, which expects an ID token or a JWT.
    // If it's a JWT, the backend issues it during login. 
    // Wait, backend `auth.controller.js` has a `/login` endpoint that issues a JWT.
    // So let's just use the backend login to get a valid JWT.
    
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'testadmin@academy.com',
      password: 'Password123'
    });

    const jwtToken = loginRes.data.token;
    console.log('Got JWT Token:', jwtToken);

    const res = await axios.post('http://localhost:5000/api/auth/register', {
      email: 'newstudent2@academy.com',
      password: 'Password123',
      name: 'New Student',
      role: 'student',
      phone: '1234567890'
    }, {
      headers: { Authorization: `Bearer ${jwtToken}` }
    });
    console.log('Register Success:', res.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  } finally {
    process.exit(0);
  }
}
run();
