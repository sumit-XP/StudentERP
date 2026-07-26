import api from './api'

// Staff Management
export const createStaff = (payload) => api.post('/hr/staff', payload)
export const getStaff = (params) => api.get('/hr/staff', { params })
export const updateStaff = (id, payload) => api.put(`/hr/staff/${id}`, payload)

// Leave Management  
export const applyLeave = (payload) => api.post('/hr/leaves', payload)
export const getLeaves = (params) => api.get('/hr/leaves', { params })
export const approveLeave = (id, payload) => api.put(`/hr/leaves/${id}/approve`, payload)
export const getMyLeaves = () => api.get('/hr/my-leaves')
