import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { getUser, logout } from '../services/auth'
import {
  LayoutDashboard, BookOpen, School, ClipboardCheck, FileText,
  Megaphone, BarChart3, DollarSign, Users, GraduationCap,
  FileBarChart, MessageSquare, Bell, LogOut, Menu, X,
  Calendar, Wallet, Home, Search, ShieldCheck, PlusSquare
} from 'lucide-react'
import { useState } from 'react'

const NavSection = ({ title, children, expanded }) => (
  <div className="nav-section">
    {expanded && <div className="nav-section-title">{title}</div>}
    <div className="space-y-1">{children}</div>
  </div>
)

const NavItem = ({ to, label, icon: Icon, expanded, onNavigate, active }) => (
  <NavLink
    to={to}
    onClick={onNavigate}
    className={({ isActive }) =>
      `nav-item ${active !== undefined ? (active ? 'nav-item-active' : 'nav-item-inactive') : (isActive ? 'nav-item-active' : 'nav-item-inactive')}`
    }
    title={!expanded ? label : undefined}
  >
    <Icon className="w-5 h-5" />
    {expanded && <span className="truncate">{label}</span>}
  </NavLink>
)

export default function Layout() {
  const user = getUser()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  const onLogout = async () => {
    await logout()
    navigate('/login')
  }

  const renderNav = (onNavigate) => (
    <>
      {/* ── Super Admin ── */}
      {user?.role === 'super_admin' && (
        <NavSection title="Platform" expanded={sidebarOpen}>
          <NavItem to="/super-admin" label="Super Admin" icon={ShieldCheck} expanded={sidebarOpen} onNavigate={onNavigate} />
        </NavSection>
      )}

      {/* ── Student / Parent (shared dashboard) ── */}
      {(user?.role === 'student' || user?.role === 'parent') && (
        <NavSection title={user?.role === 'parent' ? 'Parent Portal' : 'Student Portal'} expanded={sidebarOpen}>
          <NavItem to="/student-dashboard?tab=attendance" label="My Attendance" icon={ClipboardCheck} expanded={sidebarOpen} onNavigate={onNavigate} active={location.pathname === '/student-dashboard' && location.search === '?tab=attendance'} />
          <NavItem to="/student-dashboard?tab=assignments" label="Assignments"   icon={FileText}       expanded={sidebarOpen} onNavigate={onNavigate} active={location.pathname === '/student-dashboard' && location.search === '?tab=assignments'} />
          <NavItem to="/reports"           label="My Report Card" icon={FileBarChart}  expanded={sidebarOpen} onNavigate={onNavigate} />
          <NavItem to="/student-dashboard?tab=fees" label="My Fees"       icon={DollarSign}     expanded={sidebarOpen} onNavigate={onNavigate} active={location.pathname === '/student-dashboard' && location.search === '?tab=fees'} />
        </NavSection>
      )}

      {/* ── Teacher ── */}
      {user?.role === 'teacher' && (
        <>
          <NavSection title="Workspace" expanded={sidebarOpen}>
            <NavItem to="/schedule"   label="Schedule" icon={Calendar} expanded={sidebarOpen} onNavigate={onNavigate} />
          </NavSection>

          <NavSection title="Academics" expanded={sidebarOpen}>
            <NavItem to="/attendance"   label="Mark Attendance"    icon={ClipboardCheck} expanded={sidebarOpen} onNavigate={onNavigate} />
            <NavItem to="/assignments"  label="Create Assignments"  icon={PlusSquare}     expanded={sidebarOpen} onNavigate={onNavigate} />
            <NavItem to="/reports"      label="Reports"             icon={FileBarChart}   expanded={sidebarOpen} onNavigate={onNavigate} />
          </NavSection>

          <NavSection title="Communication" expanded={sidebarOpen}>
            <NavItem to="/messaging"     label="Messaging"     icon={MessageSquare} expanded={sidebarOpen} onNavigate={onNavigate} />
            <NavItem to="/notifications" label="Notifications" icon={Bell}          expanded={sidebarOpen} onNavigate={onNavigate} />
          </NavSection>
        </>
      )}

      {/* ── Admin ── */}
      {user?.role === 'admin' && (
        <>
          <NavSection title="Workspace" expanded={sidebarOpen}>
            <NavItem to="/dashboard"          label="Dashboard"  icon={LayoutDashboard} expanded={sidebarOpen} onNavigate={onNavigate} />
          </NavSection>

          <NavSection title="Academics" expanded={sidebarOpen}>
            <NavItem to="/classes"     label="Classes"     icon={School}         expanded={sidebarOpen} onNavigate={onNavigate} />
            <NavItem to="/attendance"  label="Attendance"  icon={ClipboardCheck} expanded={sidebarOpen} onNavigate={onNavigate} />
            <NavItem to="/reports"     label="Reports"     icon={FileBarChart}   expanded={sidebarOpen} onNavigate={onNavigate} />
          </NavSection>

          <NavSection title="Operations" expanded={sidebarOpen}>
            <NavItem to="/students" label="Students"        icon={GraduationCap} expanded={sidebarOpen} onNavigate={onNavigate} />
            <NavItem to="/staff"    label="Teachers & Staff" icon={Users}         expanded={sidebarOpen} onNavigate={onNavigate} />
            <NavItem to="/fees"     label="Fees"            icon={DollarSign}    expanded={sidebarOpen} onNavigate={onNavigate} />
          </NavSection>

          <NavSection title="Communication" expanded={sidebarOpen}>
            <NavItem to="/announcements" label="Announcements" icon={Megaphone}     expanded={sidebarOpen} onNavigate={onNavigate} />
            <NavItem to="/messaging"     label="Messaging"     icon={MessageSquare} expanded={sidebarOpen} onNavigate={onNavigate} />
            <NavItem to="/notifications" label="Notifications" icon={Bell}          expanded={sidebarOpen} onNavigate={onNavigate} />
          </NavSection>
        </>
      )}
    </>
  )

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 lg:flex">
      {mobileOpen && <button className="fixed inset-0 z-30 bg-gray-950/40 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu" />}

      <aside className={`${mobileOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-40 flex bg-white transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${sidebarOpen ? 'w-72' : 'w-20'} border-r border-gray-200 shadow-sm flex-col`}>
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <div className="font-bold text-lg text-gray-950">School ERP</div>
                <div className="text-xs text-gray-500 capitalize">{user?.role || 'user'} portal</div>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
          {renderNav(() => setMobileOpen(false))}
        </nav>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden p-4 border-t border-gray-200 hover:bg-gray-50 transition-colors lg:flex items-center justify-center gap-2 text-gray-600"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          {sidebarOpen && <span className="text-sm font-medium">Collapse</span>}
        </button>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button className="btn btn-outline px-3 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </button>
              <div className="hidden h-10 w-72 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500 md:flex">
                <Search className="h-4 w-4" />
                Search modules, students, staff
              </div>
              <div className="min-w-0 md:hidden">
                <div className="truncate text-sm font-semibold text-gray-950">School ERP</div>
                <div className="text-xs text-gray-500 capitalize">{user?.role || 'user'} portal</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 sm:flex">
                <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center text-white font-bold">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="hidden md:block">
                  <div className="text-sm font-semibold text-gray-800">{user?.name}</div>
                  <div className="text-xs text-gray-500">{user?.email || user?.role}</div>
                </div>
              </div>

              <button
                className="btn btn-outline flex items-center gap-2"
                onClick={onLogout}
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 flex flex-col">
          <div className="animate-fade-in flex-1 flex flex-col relative">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}
