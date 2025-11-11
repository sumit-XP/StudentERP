import api from './api'

export const getClasses = () => api.get('/academic/classes')
export const getClassesList = (params) => api.get('/academic/classes', { params })
export const getStudents = (params) => api.get('/academic/students', { params })
export const createStudent = (payload) => api.post('/academic/students', payload)

// Academic years
export const getAcademicYears = () => api.get('/academic/academic-years')
export const createAcademicYear = (payload) => api.post('/academic/academic-years', payload)
export const getCurrentAcademicYear = () => api.get('/academic/academic-years/current')

// Classes
export const createClass = (payload) => api.post('/academic/classes', payload)
export const getClassDetails = (id) => api.get(`/academic/classes/${id}`)

// Teachers
export const createTeacher = (payload) => api.post('/academic/teachers', payload)

// Promotions
export const bulkPromote = (classId, payload) => api.post(`/academic/classes/${classId}/bulk-promote`, payload)

export const getStudentGuardians = (studentId) => api.get(`/academic/students/${studentId}/guardians`)
export const addStudentGuardian = (studentId, payload) => api.post(`/academic/students/${studentId}/guardians`, payload)
export const deleteStudentGuardian = (studentId, guardianId) => api.delete(`/academic/students/${studentId}/guardians/${guardianId}`)

export const getStudentDocuments = (studentId) => api.get(`/academic/students/${studentId}/documents`)
export const addStudentDocument = (studentId, payload) => api.post(`/academic/students/${studentId}/documents`, payload)
export const deleteStudentDocument = (studentId, documentId) => api.delete(`/academic/students/${studentId}/documents/${documentId}`)

export const getStudentPromotions = (studentId) => api.get(`/academic/students/${studentId}/promotions`)
export const promoteStudent = (studentId, payload) => api.post(`/academic/students/${studentId}/promotions`, payload)

export const uploadResourceFile = (form) => api.post('/upload/resource-file', form, { headers: { 'Content-Type': 'multipart/form-data' } })

