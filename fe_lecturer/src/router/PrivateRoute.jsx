import { Navigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

export default function PrivateRoute({ children, allowedRoles }) {
  const { user, activeRole } = useAuth()

  // Chưa đăng nhập
  if (!user) return <Navigate to="/login" replace />

  if (allowedRoles?.length) {
    // 1. User có role đó không?
    const hasRole = (user.roles || []).some((r) => allowedRoles.includes(r))
    if (!hasRole) return <Navigate to="/me" replace />

    // 2. Đang active đúng role không? (phải qua trang chọn role)
    if (!allowedRoles.includes(activeRole)) return <Navigate to="/me" replace />
  }

  return children
}
