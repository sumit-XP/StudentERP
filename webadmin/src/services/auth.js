import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '../config/firebase'
import api from './api'

export async function login(email, password) {
  // 1) Firebase login
  const cred = await signInWithEmailAndPassword(auth, email, password)
  const idToken = await cred.user.getIdToken()

  // 2) Backend login -> get JWT
  const { data } = await api.post('/auth/login', { idToken })
  const jwt = data.token

  localStorage.setItem('erp_jwt', jwt)
  localStorage.setItem('erp_user', JSON.stringify(data.user))

  return data.user
}

export function getUser() {
  const raw = localStorage.getItem('erp_user')
  return raw ? JSON.parse(raw) : null
}

export function getRole() {
  return getUser()?.role
}

export async function logout() {
  try { await api.post('/auth/logout') } catch {}
  await signOut(auth)
  localStorage.removeItem('erp_jwt')
  localStorage.removeItem('erp_user')
}

export function registerUser(payload) {
  return api.post('/auth/register', payload)
}

export function listUsers(params) {
  return api.get('/auth/users', { params })
}
