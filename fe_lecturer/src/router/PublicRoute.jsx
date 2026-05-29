import { Navigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

// Chặn user đã đăng nhập vào trang login → redirect /me
export default function PublicRoute({ children }) {
  const { user } = useAuth()
  if (user) return <Navigate to="/me" replace />
  return children
}
