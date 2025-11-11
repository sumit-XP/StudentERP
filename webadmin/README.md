# School ERP Web Admin (Admin & Teacher)

A modern React + Vite + Tailwind web admin for School ERP. Supports Firebase login, JWT-based backend auth, role-aware pages for Admin and Teacher, file uploads with robust error handling, and analytics dashboards.

## ✨ Features
- Secure login with Firebase, backend JWT exchange
- Sidebar navigation and protected routes
- Admin & Teacher workflows: Subjects, Classes, Attendance, Assignments, Announcements, Analytics
- File uploads with validation and error fallback
- API error interception and messaging

## 📦 Tech
- React 18 + Vite
- TailwindCSS
- Firebase Web SDK (Auth)
- Axios
- React Router v6

## 🔧 Setup

1) Install dependencies
```bash
cd webadmin
npm install
```

2) Create `.env` from example
```bash
cp .env.example .env
```
Fill with your Firebase Web app config and backend URL (typically `http://localhost:5000/api`).

3) Tailwind config fix (if needed)
If you see a build error due to the header comment in `tailwind.config.js`, fix the first line to:
```js
/** @type {import('tailwindcss').Config} */
```

4) Run dev server
```bash
npm run dev
```
Open http://localhost:5173

## 🔐 Authentication Flow
1. Email/password login via Firebase
2. Frontend obtains Firebase ID token
3. Calls backend `POST /api/auth/login` to exchange for JWT
4. Stores JWT in `localStorage` and attaches to all API requests (Authorization: Bearer <token>)

## 🧪 Test Users
Use the same Firebase users you create for backend testing. Ensure your user has a DB record with the proper role (`admin` or `teacher`).

Example SQL to set role:
```sql
UPDATE users SET role_id = (SELECT id FROM roles WHERE name='admin')
WHERE firebase_uid = 'FIREBASE_UID_HERE';
```

## 🔌 API Base URL
Configure via `.env`:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

## 🗂 Structure
```
webadmin/
  src/
    components/
      FileUpload.jsx
      Layout.jsx
      ProtectedRoute.jsx
    pages/
      Login.jsx
      Dashboard.jsx
      Subjects.jsx
      Classes.jsx
      Attendance.jsx
      Assignments.jsx
      Announcements.jsx
      Analytics.jsx
    services/
      api.js
      auth.js
    config/
      firebase.js
```

## 📤 Uploads
- `FileUpload` component wraps file inputs with error fallback.
- Uses `multipart/form-data` to `/api/upload/*` endpoints.

## 🚨 Error Handling
- Axios interceptor logs and propagates server errors.
- Components display user-friendly error messages and allow retry.

## ✅ Ready to Deploy
- Build: `npm run build`
- Preview: `npm run preview`
- Output in `dist/` (serve behind reverse proxy with backend).
