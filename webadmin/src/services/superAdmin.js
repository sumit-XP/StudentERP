import api from './api'

export const getPlatformStats = () => api.get('/super-admin/stats')
export const getSchools = (params) => api.get('/super-admin/schools', { params })
export const createSchool = (payload) => api.post('/super-admin/schools', payload)
export const updateSchool = (id, payload) => api.put(`/super-admin/schools/${id}`, payload)
export const toggleSchoolStatus = (id, payload) => api.patch(`/super-admin/schools/${id}/status`, payload)
export const createSchoolAdmin = (schoolId, payload) => api.post(`/super-admin/schools/${schoolId}/admins`, payload)
export const createSchoolAcademicYear = (schoolId, payload) => api.post(`/super-admin/schools/${schoolId}/academic-years`, payload)
