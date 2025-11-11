import api from './api'

export const getAttendanceReport = (params) => api.get('/attendance/report', { params })
export const getClassAttendanceSummary = (params) => api.get('/attendance/class-summary', { params })
export const getStudentAttendanceSummary = (params) => api.get('/attendance/student', { params })
