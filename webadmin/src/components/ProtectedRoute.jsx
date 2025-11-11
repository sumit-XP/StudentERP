import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getUser } from '../services/auth'

export default function ProtectedRoute() {
  const user = getUser()
  const location = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return <Outlet />
}
