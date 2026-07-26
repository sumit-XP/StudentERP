import api from './api'

export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password })
  const jwt = data.token

  localStorage.setItem('erp_jwt', jwt)
  localStorage.setItem('erp_user', JSON.stringify(data.user))

  return data.user
}

export function getUser() {
  try {
    const raw = localStorage.getItem('erp_user')
    if (!raw || raw === 'undefined') return null
    return JSON.parse(raw)
  } catch (e) {
    return null
  }
}

export function getRole() {
  return getUser()?.role
}

export async function logout() {
  try { await api.post('/auth/logout') } catch {}
  localStorage.removeItem('erp_jwt')
  localStorage.removeItem('erp_user')
}

export async function registerUser(payload) {
  const { data } = await api.post('/auth/register', payload)
  return data
}

export function listUsers(params) {
  return api.get('/auth/users', { params })
}
