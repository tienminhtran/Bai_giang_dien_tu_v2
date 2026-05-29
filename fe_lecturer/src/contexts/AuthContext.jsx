import { createContext, useState } from 'react'
import authService from '../services/authService'

export const AuthContext = createContext({})

const loadUserFromStorage = () => {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser]           = useState(loadUserFromStorage)
  const [loading, setLoading]     = useState(false)
  // Role đang hoạt động — người dùng đã chọn ở trang UserRole
  const [activeRole, setActiveRole] = useState(() => localStorage.getItem('activeRole') || null)

  const login = async (arg1, arg2, arg3) => {
    let username, password, client_id
    if (typeof arg1 === 'object') {
      ({ username, password, client_id = 'staff_portal' } = arg1)
    } else {
      username = arg1; password = arg2; client_id = arg3 || 'staff_portal'
    }
    setLoading(true)
    try {
      const res = await authService.login({ username, password, client_id })
      if (res?.success) {
        if (res.data?.access_token)  localStorage.setItem('accessToken',  res.data.access_token)
        if (res.data?.refresh_token) localStorage.setItem('refreshToken', res.data.refresh_token)
        if (res.data?.user)          localStorage.setItem('user', JSON.stringify(res.data.user))
        setUser(res.data.user)
        return { ok: true, data: res.data }
      }
      return { ok: false, message: res?.message }
    } catch (err) {
      return { ok: false, error: err }
    } finally {
      setLoading(false)
    }
  }

  const refreshUser = async () => {
    try {
      const res = await authService.getMe()
      if (res?.success && res.data) {
        localStorage.setItem('user', JSON.stringify(res.data))
        setUser(res.data)
        return { ok: true, data: res.data }
      }
      return { ok: false }
    } catch (err) {
      logout()
      return { ok: false, error: err }
    }
  }

  // Chọn role → lưu vào localStorage để giữ qua reload
  const selectRole = (role) => {
    if (role) {
      localStorage.setItem('activeRole', role)
    } else {
      localStorage.removeItem('activeRole')
    }
    setActiveRole(role)
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    localStorage.removeItem('activeRole')
    setUser(null)
    setActiveRole(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading, refreshUser, activeRole, selectRole }}>
      {children}
    </AuthContext.Provider>
  )
}
