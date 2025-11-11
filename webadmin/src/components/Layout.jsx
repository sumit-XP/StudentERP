import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { getUser, logout } from '../services/auth'

const NavItem = ({ to, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `block px-4 py-2 rounded-md ${isActive ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'}`}
  >{label}</NavLink>
)

export default function Layout() {
  const user = getUser()
  const navigate = useNavigate()

  const onLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 bg-white border-r p-4 space-y-2">
        <div className="px-2 py-3 text-lg font-semibold">School ERP</div>
        <NavItem to="/dashboard" label="Dashboard" />
        <NavItem to="/subjects" label="Subjects" />
        <NavItem to="/classes" label="Classes" />
        <NavItem to="/attendance" label="Attendance" />
        <NavItem to="/assignments" label="Assignments & Resources" />
        <NavItem to="/announcements" label="Announcements" />
        <NavItem to="/analytics" label="Analytics" />
        <NavItem to="/fees" label="Fees" />
        <NavItem to="/students" label="Students" />
        <NavItem to="/attendance-reports" label="Attendance Reports" />
        <NavItem to="/messaging" label="Messaging" />
        <NavItem to="/notifications" label="Notifications" />
      </aside>
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-lg font-semibold">Welcome, {user?.name || 'User'}</div>
            <div className="text-xs text-gray-500">Role: <span className="badge bg-gray-200">{user?.role}</span></div>
          </div>
          <button className="btn btn-outline" onClick={onLogout}>Logout</button>
        </div>
        <Outlet />
      </main>
    </div>
  )
}
