import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Subjects from './pages/Subjects.jsx'
import Classes from './pages/Classes.jsx'
import Attendance from './pages/Attendance.jsx'
import Assignments from './pages/Assignments.jsx'
import Announcements from './pages/Announcements.jsx'
import Analytics from './pages/Analytics.jsx'
import Fees from './pages/Fees.jsx'
import Staff from './pages/Staff.jsx'
import Students from './pages/Students.jsx'
import AttendanceReports from './pages/AttendanceReports.jsx'
import Messaging from './pages/Messaging.jsx'
import Notifications from './pages/Notifications.jsx'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}> 
        <Route element={<Layout />}> 
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/subjects" element={<Subjects />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/assignments" element={<Assignments />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/fees" element={<Fees />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/students" element={<Students />} />
          <Route path="/attendance-reports" element={<AttendanceReports />} />
          <Route path="/messaging" element={<Messaging />} />
          <Route path="/notifications" element={<Notifications />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  )
}
