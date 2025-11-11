# School ERP System - Quick Setup Guide

## 🚀 Quick Start (5 minutes)

### 1. Prerequisites Check
```bash
# Check Node.js (v16+)
node --version

# Check PostgreSQL (v12+)
psql --version

# Check npm
npm --version
```

### 2. Database Setup
```bash
# Create database
createdb student_erp

# Or using psql
psql -c "CREATE DATABASE student_erp;"
```

### 3. Install Dependencies
```bash
cd backend
npm install
```

### 4. Environment Configuration
Make sure your `.env` file has:
```env
PORT=5000
DATABASE_URL=postgresql://postgres:1234@localhost:5432/student_erp
JWT_SECRET=e8b3f2c5a1d9e0f8c7b6a5d4e3f2c1b0a9d8e7f6c5b4a3d2e1f0c9b8a7d6e5f4c3b2a1d0e9f8c7b6a5d4e3f2c1b0a9d8e7f6c5b4a3d2e1f0c9b8a7d6e5f4
```

### 5. Firebase Setup
1. Create Firebase project at https://console.firebase.google.com
2. Enable Authentication → Email/Password
3. Go to Project Settings → Service Accounts
4. Generate new private key
5. Save as `firebase-service-account.json` in backend root

### 6. Database Schema Setup
```bash
# Automated setup (recommended)
npm run setup

# Or manual setup
psql -d student_erp -f src/config/schema.sql
```

### 7. Start the Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### 8. Test the API
```bash
# Check if server is running
curl http://localhost:5000/api/health

# Run automated tests
npm test

# Check database connection
npm run setup:check
```

## 🧪 Testing Your Setup

### Test Health Check
```bash
curl http://localhost:5000/api/health
```
Expected response:
```json
{
  "status": "ERP Backend Running ✅",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0"
}
```

### Test API Overview
```bash
curl http://localhost:5000/api
```

### Test User Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "password123",
    "name": "Test Admin",
    "role": "admin"
  }'
```

## 📊 Verify Database Setup

```bash
# Check database statistics
npm run setup:stats
```

Should show tables with sample data:
- roles: 4 records
- academic_years: 1 record
- subjects: 5 records
- classes: 6 records

## 🔧 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Check database exists
psql -l | grep student_erp

# Test connection
psql -d student_erp -c "SELECT NOW();"
```

### Firebase Issues
- Ensure `firebase-service-account.json` exists in backend root
- Check Firebase project has Authentication enabled
- Verify service account has proper permissions

### Port Issues
```bash
# Check if port 5000 is in use
netstat -tulpn | grep :5000

# Use different port
PORT=3001 npm run dev
```

## 📱 Frontend Integration

### Authentication Flow
1. Frontend authenticates user with Firebase
2. Gets Firebase ID token
3. Sends ID token to `/api/auth/login`
4. Receives JWT token for API calls
5. Include JWT in Authorization header: `Bearer <token>`

### Sample Frontend Code (JavaScript)
```javascript
// Firebase login
const userCredential = await signInWithEmailAndPassword(auth, email, password);
const idToken = await userCredential.user.getIdToken();

// Backend login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ idToken })
});

const { token } = await response.json();

// Use JWT for API calls
const apiResponse = await fetch('/api/academic/classes', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

## 🚀 Production Deployment

### Environment Variables
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=your-production-secret
```

### PM2 Process Manager
```bash
npm install -g pm2
pm2 start src/app.js --name "school-erp"
pm2 startup
pm2 save
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 📚 API Usage Examples

### Create Academic Year
```bash
curl -X POST http://localhost:5000/api/academic/academic-years \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "yearName": "2024-2025",
    "startDate": "2024-04-01",
    "endDate": "2025-03-31",
    "isCurrent": true
  }'
```

### Create Class
```bash
curl -X POST http://localhost:5000/api/academic/classes \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Class 10A",
    "gradeLevel": 10,
    "section": "A",
    "academicYearId": 1
  }'
```

### Upload File
```bash
curl -X POST http://localhost:5000/api/upload/profile-image \
  -H "Authorization: Bearer <jwt-token>" \
  -F "profileImage=@/path/to/image.jpg"
```

## 🔒 Security Checklist

- ✅ Firebase Authentication configured
- ✅ JWT tokens with expiration
- ✅ Role-based access control
- ✅ Input validation and sanitization
- ✅ File upload restrictions
- ✅ CORS configuration
- ✅ SQL injection prevention
- ✅ Environment variables for secrets

## 📞 Support

If you encounter issues:

1. **Check logs**: Server logs show detailed error information
2. **Database connection**: Run `npm run setup:check`
3. **API testing**: Use `npm test` for automated testing
4. **Firebase setup**: Verify service account key and project configuration
5. **Port conflicts**: Try different port with `PORT=3001 npm run dev`

## 🎯 Next Steps

1. **Frontend Development**: Connect React/React Native frontend
2. **Mobile App**: Use React Native with the same API
3. **Real-time Features**: Add Socket.io for live updates
4. **Push Notifications**: Implement FCM for mobile notifications
5. **File Storage**: Integrate cloud storage (AWS S3, Google Cloud)
6. **Email Service**: Add email notifications
7. **Reports**: Generate PDF reports
8. **Backup**: Set up automated database backups

---

**🎉 Congratulations! Your School ERP System backend is ready to use!**

---

## 🖥️ Web Admin Frontend Setup (Admin & Teacher)

The web admin (React + Vite + Tailwind) lives in `webadmin/`.

### 1) Install and configure
```bash
cd webadmin
npm install
cp .env.example .env
```
Fill `.env` with your Firebase Web app config and point `VITE_API_BASE_URL` to your backend, e.g. `http://localhost:5000/api`.

### 2) Tailwind header fix (if build errors)
Ensure the first line of `webadmin/tailwind.config.js` is exactly:
```js
/** @type {import('tailwindcss').Config} */
```

### 3) Run the app
```bash
npm run dev
```
Open http://localhost:5173

### 4) Sign in and roles
- Sign in with a Firebase user (the same one you used in backend tests).
- Make sure the user exists in `users` with a valid role. To grant admin:
```sql
UPDATE users SET role_id = (SELECT id FROM roles WHERE name='admin')
WHERE firebase_uid = 'YOUR_FIREBASE_UID';
```

### 5) Try core flows
- Subjects: create/list subjects (`/subjects`)
- Classes: create/list classes (`/classes`)
- Attendance: mark attendance (`/attendance`)
- Assignments: upload file then create assignment (`/assignments`)
- Announcements: create/view (`/announcements`)
- Analytics: overview and attendance metrics (`/analytics`)

### 6) Uploads & errors
- Upload components use `multipart/form-data` and show clear errors.
- API errors are intercepted and surfaced in UI.
