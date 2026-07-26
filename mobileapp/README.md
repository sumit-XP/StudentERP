# StudentERP Mobile

React Native mobile app for the StudentERP system. Provides role-based access for admins, teachers, students, and parents with modules for dashboards, attendance, assignments, communication, fees, and user management.

## Tech Stack

- React Native 0.72.6
- TypeScript
- @react-navigation/native + stack + bottom-tabs
- @react-native-firebase/* (auth, firestore, messaging, storage)
- react-native-encrypted-storage
- Axios with interceptors + axios-mock-adapter

## Architecture

```
src/
├── api/                  # Axios client, mocks
├── contexts/             # AuthContext
├── navigation/
│   ├── RootNavigator.tsx
│   ├── AppNavigator.tsx
│   ├── tabs/             # Role-specific bottom tab navigators
│   └── features/         # Stack navigators per feature
├── screens/
│   ├── auth/
│   ├── dashboards/
│   ├── attendance/
│   ├── assignments/
│   ├── communication/
│   ├── fees/
│   ├── profile/
│   └── users/
├── services/
├── types/
└── __tests__/
```

## Role-Based Navigation

| Role | Tabs |
|------|------|
| Admin | Dashboard, Users, Fees, Profile |
| Teacher | Dashboard, Attendance, Assignments, Profile |
| Student | Dashboard, Assignments, Communication, Profile |
| Parent | Dashboard, Fees, Communication, Profile |

## Implemented Screens

### Dashboards
- AdminDashboard, TeacherDashboard, StudentDashboard, ParentDashboard
- AdminAttendanceOverview, AdminResultsOverview
- GradingResults, CreateAnnouncement, StudentPayments

### Attendance
- MarkAttendance (teacher)
- AttendanceHistory (student/parent)
- AttendanceReports (teacher/admin)

### Assignments
- AssignmentList, AssignmentDetail
- SubmitAssignment (student)
- GradeSubmission (teacher)
- GradingResults

### Communication
- Announcements
- MessagesList, Chat
- PTM (Parent-Teacher Meetings)

### Fees
- InvoiceList (filter/search)
- InvoiceDetail
- OnlinePayment (Razorpay order creation)
- FeeReports (dues/defaulters/collections)

### Users
- UserList (admin directory + search)
- StudentProfile (guardians + documents)

### Profile
- Profile (edit + password change)
- Notifications

## Auth

- JWT token stored in EncryptedStorage
- Axios interceptor attaches token to requests
- Mock login by email substring for dev/testing
- Test role-switch menu on login screen

## API

- Base client in `src/api/client.ts`
- Response interceptor normalizes `{ data: ... }` wrapper
- Mock adapter in `src/api/mockAdapter.ts` for offline dev

## Testing

```
npm test
```

Coverage includes AuthContext, authService, and API client.

## Run

```bash
npm install
npm start
```

Then press `a` for Android or `i` for iOS.
