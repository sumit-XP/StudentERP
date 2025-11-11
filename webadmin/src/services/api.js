import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

const api = axios.create({ baseURL: API_BASE })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('erp_jwt')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status
    const message = error?.response?.data?.error || error?.response?.data?.message || error.message
    console.error('API error:', message)
    if (status === 401 || status === 403) {
      try {
        localStorage.removeItem('erp_jwt')
        localStorage.removeItem('erp_user')
      } catch {}
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
