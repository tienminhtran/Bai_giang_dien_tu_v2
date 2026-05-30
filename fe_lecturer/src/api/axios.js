import axios from 'axios'

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  withCredentials: true,
})

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    if (status === 401) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      localStorage.removeItem('activeRole')
      window.location.href = '/login'
    } else if (status === 403) {
      // Không có quyền với role hiện tại → về trang chọn role
      localStorage.removeItem('activeRole')
      window.location.href = '/me'
    }
    return Promise.reject(error)
  }
)

export default instance
