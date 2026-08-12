import api from './api';

// ── EXAMS ──────────────────────────────────────────────────

export const getExams = (params = {}) =>
  api.get('/academic/exams', { params });

export const createExam = (data) =>
  api.post('/academic/exams', data);

export const updateExam = (id, data) =>
  api.put(`/academic/exams/${id}`, data);

// ── TEACHER - ASSIGNED SUBJECTS ────────────────────────────

export const getTeacherAssignedSubjects = () =>
  api.get('/academic/teacher/assigned-subjects');

// ── TEACHER - MARKS ENTRY ──────────────────────────────────

export const getExamGrades = (examId, classId, subjectId) =>
  api.get(`/academic/exams/${examId}/classes/${classId}/subjects/${subjectId}/grades`);

export const saveExamGrades = (examId, classId, subjectId, payload) =>
  api.post(`/academic/exams/${examId}/classes/${classId}/subjects/${subjectId}/grades`, payload);

// ── ADMIN - SUBMISSION MATRIX ──────────────────────────────

export const getExamClassMatrix = (examId, classId) =>
  api.get(`/academic/exams/${examId}/classes/${classId}/matrix`);

export const publishClassResult = (examId, classId) =>
  api.post(`/academic/exams/${examId}/classes/${classId}/publish`);

// ── ADMIN - STUDENT RESULTS ────────────────────────────────

export const getStudentPublishedResults = (studentId, params = {}) =>
  api.get(`/academic/students/${studentId}/published-results`, { params });

// ── STUDENT / PARENT - OWN RESULTS ────────────────────────

export const getMyPublishedResults = (params = {}) =>
  api.get('/academic/results/my', { params });
