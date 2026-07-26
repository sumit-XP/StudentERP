import axios from 'axios';
import fs from 'fs';

async function run() {
  const token = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJodHRwczovL2lkZW50aXR5dG9vbGtpdC5nb29nbGVhcGlzLmNvbS9nb29nbGUuaWRlbnRpdHkuaWRlbnRpdHl0b29sa2l0LnYxLklkZW50aXR5VG9vbGtpdCIsImlhdCI6MTc4MjUyNjkxOSwiZXhwIjoxNzgyNTMwNTE5LCJpc3MiOiJmaXJlYmFzZS1hZG1pbnNkay1mYnN2Y0BzdHVkZW50ZXJwLTZiYTY3LmlhbS5nc2VydmljZWFjY291bnQuY29tIiwic3ViIjoiZmlyZWJhc2UtYWRtaW5zZGstZmJzdmNAc3R1ZGVudGVycC02YmE2Ny5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsInVpZCI6Ik56REJuTTM1bXhZenB3WmNFclh4UWh4Q1JWZjIifQ.l0x19_Pr1QqJba1paPekXYnV7KyXB0yCHtLbS1S3JA8045SodPkL4Pei9gUQFQ4szUJ5tPyEs_CwpjxpP8Lmuhi-3QprMw-biLxJo1k2qJr6bqv5uw0VwyK1PRIzqgxw0ARCfy9MzTxkQ9mTLhmoQtXnrixGjSopOjVq-T9_xrKS5yv5UQH8zMsj3KtGH9ST12xzoF-4Q9JCjTtvWeJXM2NoIUoWzHnYI89Zo8wvXwFrH2E-rd41VCKjxCw2Q5ZY3Mzw9QUfRUuqfKdpbd1o2ELIQP9IcVFg0MhxIRX4dJRdWLJXsFhSqX4DCqiSrcWaBMl-Z0TUDbJ07SJDca8tmw';
  try {
    const res = await axios.post('http://localhost:5000/api/auth/register', {
      email: 'newstudent@academy.com',
      password: 'Password123',
      name: 'New Student',
      role: 'student',
      phone: '1234567890'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Success:', res.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}
run();
