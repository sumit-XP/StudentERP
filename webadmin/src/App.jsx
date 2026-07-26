import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import StudentDashboard from './pages/StudentDashboard.jsx'
import Classes from './pages/Classes.jsx'
import Attendance from './pages/Attendance.jsx'
import Assignments from './pages/Assignments.jsx'
import Announcements from './pages/Announcements.jsx'
import Fees from './pages/Fees.jsx'
import Staff from './pages/Staff.jsx'
import Students from './pages/Students.jsx'
import Reports from './pages/Reports.jsx'
import Messaging from './pages/Messaging.jsx'
import Notifications from './pages/Notifications.jsx'
import ParentPayments from './pages/ParentPayments.jsx'
import ParentDashboard from './pages/ParentDashboard.jsx'
import SuperAdmin from './pages/SuperAdmin.jsx'
import Schedule from './pages/Schedule.jsx'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { getUser } from './services/auth'

function HomeRedirect() {
  const user = getUser()
  if (!user) return <Navigate to="/login" replace />
  // Students and Parents share the same dashboard
  if (user.role === 'student' || user.role === 'parent') return <Navigate to="/student-dashboard?tab=attendance" replace />
  if (user.role === 'super_admin') return <Navigate to="/super-admin" replace />
  // teacher -> schedule
  if (user.role === 'teacher') return <Navigate to="/schedule" replace />
  // admin -> ops dashboard
  return <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/super-admin" element={<SuperAdmin />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/assignments" element={<Assignments />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/fees" element={<Fees />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/students" element={<Students />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/messaging" element={<Messaging />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/parent-payments" element={<ParentPayments />} />
          <Route path="/parent-dashboard" element={<ParentDashboard />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  )
}
