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
    const status  = error?.response?.status
    const message = error?.response?.data?.error || error?.response?.data?.message || error.message
    console.error('API error:', status, message)
    // Do NOT clear localStorage or redirect here.
    // Each page handles errors with its own catch() / fallback mock data.
    // Redirecting here would wipe the user session and crash pages mid-render.
    return Promise.reject(error)
  }
)


export default api
