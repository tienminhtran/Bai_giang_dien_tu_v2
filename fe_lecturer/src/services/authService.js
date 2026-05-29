import api from '../api/axios'
import { AUTH_EP } from '../constants'

const login = async ({ username, password, client_id }) => {
  const res = await api.post(AUTH_EP.LOGIN, { username, password, client_id })
  return res.data
}

// Lấy thông tin user hiện tại từ token
const getMe = async () => {
  const token = localStorage.getItem('accessToken')
  const res = await api.get(AUTH_EP.ME, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.data
}

const refresh = async () => {
  const res = await api.post(AUTH_EP.REFRESH)
  return res.data
}

const logout = async () => true

export default { login, getMe, refresh, logout }
