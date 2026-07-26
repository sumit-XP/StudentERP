const axios = require('axios');
async function test() {
  try {
    const login = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'sumit2008@gmail.com',
      password: 'sumit2008@gmail.com'
    });
    const token = login.data.token;
    console.log("Logged in");
    const adminReq = await axios.post('http://localhost:5000/api/super-admin/schools/67143/admins', {
      name: 'Admin Test',
      email: 'admin@school.com',
      password: 'password123',
      phone: '1234567890'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(adminReq.data);
  } catch (e) {
    console.log(e.response ? e.response.data : e.message);
  }
}
test();
