// Simple API testing script for School ERP System
// Run with: node test-api.js
// Uses Node's global fetch (Node 18+)

const BASE_URL = 'http://localhost:5000/api';
const FIREBASE_API_KEY = 'AIzaSyBGC_jMNAk2lAFG8W7BSN4UNVh5HqOLUro';
let authToken = '';
let userId = '';

// Admin credentials for testing
const ADMIN_EMAIL = 'xyz@xyz.com';
const ADMIN_PASSWORD = '123456';

// Helper function to register admin user
async function registerAdmin() {
  console.log('\n=== Registering Admin User ===');
  
  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          returnSecureToken: true
        })
      }
    );

    const data = await response.json();
    
    if (data.idToken) {
      console.log('✅ Admin registration successful');
      console.log(`User ID: ${data.localId}`);
      console.log(`Email: ${data.email}`);
      userId = data.localId;
      return data.localId;
    } else if (data.error?.message === 'EMAIL_EXISTS') {
      console.log('ℹ️  Admin user already exists - will use for login');
      return null;
    } else {
      console.error('❌ Registration failed:', data.error?.message || 'Unknown error');
      return null;
    }
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    return null;
  }
}

// Helper function to create user in database with admin role
async function createUserInDatabase(firebaseUid, token) {
  console.log('\n=== Creating User Record in Database ===');
  
  try {
    const response = await fetch(
      `${BASE_URL}/auth/register`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          firebaseUid: firebaseUid,
          email: ADMIN_EMAIL,
          role: 'admin',
          firstName: 'Admin',
          lastName: 'User'
        })
      }
    );

    const data = await response.json();
    console.log('Database user creation response:', data);
    return data;
  } catch (error) {
    console.error('❌ Database user creation error:', error.message);
    return null;
  }
}

// Helper function to login and get token
async function login() {
  console.log('\n=== Logging in as Admin ===');
  
  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          returnSecureToken: true
        })
      }
    );

    const data = await response.json();
    
    if (data.idToken) {
      authToken = data.idToken;
      userId = data.localId;
      console.log('✅ Login successful');
      console.log(`Token: ${authToken.substring(0, 50)}...`);
      console.log(`User ID: ${data.localId}`);
      console.log(`Email: ${data.email}`);
      return true;
    } else {
      console.error('❌ Login failed:', data.error?.message || 'Unknown error');
      console.error('Full error:', JSON.stringify(data.error, null, 2));
      return false;
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return false;
  }
}

// Helper function to make API requests
async function apiRequest(endpoint, method = 'GET', data = null, useAuth = false) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (useAuth && authToken) {
    options.headers.Authorization = `Bearer ${authToken}`;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    
    console.log(`\n${method} ${endpoint}`);
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    return { status: response.status, data: result };
  } catch (error) {
    console.error(`Error calling ${endpoint}:`, error.message);
    return { status: 500, error: error.message };
  }
}

// Test functions
async function testHealthCheck() {
  console.log('\n=== Testing Health Check ===');
  await apiRequest('/health');
}

async function testAPIOverview() {
  console.log('\n=== Testing API Overview ===');
  await apiRequest('');
}

async function testAcademicYear() {
  console.log('\n=== Testing Academic Year Creation ===');
  
  const academicYearData = {
    yearName: '2024-2025',
    startDate: '2024-04-01',
    endDate: '2025-03-31',
    isCurrent: true
  };
  
  return await apiRequest('/academic/academic-years', 'POST', academicYearData, true);
}

async function testSubjectCreation() {
  console.log('\n=== Testing Subject Creation ===');
  
  const subjectData = {
    name: 'Mathematics',
    code: 'MATH101',
    description: 'Basic Mathematics',
    credits: 4
  };
  
  return await apiRequest('/academic/subjects', 'POST', subjectData, true);
}

async function testGetSubjects() {
  console.log('\n=== Testing Get Subjects ===');
  return await apiRequest('/academic/subjects', 'GET', null, true);
}

async function testClassCreation() {
  console.log('\n=== Testing Class Creation ===');
  
  const classData = {
    name: 'Class 10A',
    gradeLevel: 10,
    section: 'A',
    academicYearId: 1,
    maxStudents: 40
  };
  
  return await apiRequest('/academic/classes', 'POST', classData, true);
}

async function testGetClasses() {
  console.log('\n=== Testing Get Classes ===');
  return await apiRequest('/academic/classes', 'GET', null, true);
}

async function testAnnouncement() {
  console.log('\n=== Testing Announcement Creation ===');
  
  const announcementData = {
    title: 'Welcome to New Academic Year',
    content: 'We are excited to welcome all students to the new academic year 2024-2025.',
    announcementType: 'general',
    targetAudience: 'all'
  };
  
  return await apiRequest('/communication/announcements', 'POST', announcementData, true);
}

async function testGetAnnouncements() {
  console.log('\n=== Testing Get Announcements ===');
  return await apiRequest('/communication/announcements', 'GET', null, true);
}

async function testDashboard() {
  console.log('\n=== Testing Dashboard Overview ===');
  return await apiRequest('/analytics/dashboard', 'GET', null, true);
}

// Main test runner
async function runTests() {
  console.log('🧪 Starting School ERP API Tests...\n');
  console.log(`Base URL: ${BASE_URL}`);
  
  // Test basic endpoints (no auth required)
  await testHealthCheck();
  await testAPIOverview();
  
  // Register admin user (will skip if exists)
  const newUserId = await registerAdmin();
  
  // Login to get auth token
  const loginSuccess = await login();
  
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without authentication token');
    console.log('\n💡 Troubleshooting:');
    console.log('1. Check if Firebase is configured correctly');
    console.log('2. Verify FIREBASE_API_KEY is correct');
    console.log('3. Ensure admin user exists in Firebase');
    return;
  }
  
  // If new user was created, add them to database
  if (newUserId) {
    await createUserInDatabase(newUserId, authToken);
  }
  
  console.log('\n=== Authentication Required Tests ===');
  console.log('⚠️  Note: If you get 403 errors, you need to manually set the user role to "admin" in your database');
  console.log('   Run this SQL: UPDATE users SET role = \'admin\' WHERE firebase_uid = \'' + userId + '\';');
  
  // Test academic management
  await testAcademicYear();
  await testSubjectCreation();
  await testGetSubjects();
  await testClassCreation();
  await testGetClasses();
  
  // Test communication
  await testAnnouncement();
  await testGetAnnouncements();
  
  // Test analytics
  await testDashboard();
  
  console.log('\n✅ API Testing Complete!');
  console.log('\n📝 Summary:');
  console.log(`- Base URL: ${BASE_URL}`);
  console.log(`- User ID: ${userId}`);
  console.log(`- Auth Token Length: ${authToken.length} characters`);
  console.log(`- Token Preview: ${authToken.substring(0, 50)}...`);
  
  console.log('\n🔧 If you encountered 403 errors, run this SQL:');
  console.log(`   UPDATE users SET role = 'admin' WHERE firebase_uid = '${userId}';`);
}

// Instructions for manual testing
function printManualTestingInstructions() {
  console.log('\n📋 Manual Testing Instructions:');
  console.log('\n1. Start the server:');
  console.log('   cd backend && npm run dev');
  console.log('\n2. Run this test script:');
  console.log('   node test-api.js');
  console.log('\n3. Fix 403 Access Denied errors:');
  console.log('   a. Get the Firebase UID from the test output');
  console.log('   b. Run: psql -d student_erp');
  console.log('   c. Run: UPDATE users SET role = \'admin\' WHERE firebase_uid = \'YOUR_UID\';');
  console.log('\n4. Test with curl:');
  console.log('   curl http://localhost:5000/api/health');
  console.log('\n5. Database setup (run once):');
  console.log('   psql -d student_erp -f src/config/schema.sql');
}

// Run the tests
if (process.argv.includes('--help')) {
  printManualTestingInstructions();
} else {
  runTests().catch(console.error);
}

// Export for use in other files
export { apiRequest, BASE_URL, login };