import { Routes, Route, Navigate } from 'react-router-dom'
import Login     from '../pages/Auth/Login'
import UserRole  from '../pages/Auth/UserRole'
import Dashboard from '../pages/Dashboard'
import PublicRoute  from './PublicRoute'
import PrivateRoute from './PrivateRoute'
import useAuth from '../hooks/useAuth'
import { ROLES } from '../constants'

export default function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/me"    element={<PrivateRoute><UserRole /></PrivateRoute>} />

      {/* Tất cả sub-route được xử lý bên trong Dashboard.jsx qua nested <Routes> */}
      <Route path="/dashboard/admin/*"
        element={<PrivateRoute allowedRoles={[ROLES.ADMIN]}><Dashboard /></PrivateRoute>} />

      <Route path="/dashboard/lecturer/*"
        element={<PrivateRoute allowedRoles={[ROLES.LECTURER]}><Dashboard /></PrivateRoute>} />

      <Route path="/dashboard/council/*"
        element={<PrivateRoute allowedRoles={[ROLES.COUNCIL]}><Dashboard /></PrivateRoute>} />

      <Route path="/dashboard/department-head/*"
        element={<PrivateRoute allowedRoles={[ROLES.DEPARTMENT_HEAD]}><Dashboard /></PrivateRoute>} />

      <Route path="/dashboard/major-head/*"
        element={<PrivateRoute allowedRoles={[ROLES.MAJOR_HEAD]}><Dashboard /></PrivateRoute>} />

      <Route path="/"
        element={user ? <Navigate to="/me" replace /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
