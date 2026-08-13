import apiClient from '../api/client';

export const academicService = {
  getClasses: async () => {
    const response = await apiClient.get('/academic/classes');
    return response.data?.classes || response.data?.data || response.data || [];
  },

  getStudents: async (params?: { classId?: string; search?: string }) => {
    const response = await apiClient.get('/academic/students', { params });
    return response.data?.students || response.data?.data || response.data || [];
  },

  getTeachers: async (params?: { department?: string; search?: string }) => {
    const response = await apiClient.get('/academic/teachers', { params });
    return response.data?.teachers || response.data?.data || response.data || [];
  },

  getStudentGuardians: async (studentId: string) => {
    const response = await apiClient.get(`/academic/students/${studentId}/guardians`);
    return response.data?.guardians || response.data?.data || response.data || [];
  },

  getStudentDocuments: async (studentId: string) => {
    const response = await apiClient.get(`/academic/students/${studentId}/documents`);
    return response.data?.documents || response.data?.data || response.data || [];
  },

  getSubjects: async () => {
    const response = await apiClient.get('/academic/subjects');
    return response.data?.subjects || response.data?.data || response.data || [];
  },

  getTeacherSchedule: async (teacherId: string) => {
    const response = await apiClient.get(`/academic/teachers/${teacherId}/schedule`);
    return response.data?.schedule || response.data?.data || response.data || [];
  },

  getClassGrades: async (classId: string, subjectId: string) => {
    const response = await apiClient.get(`/academic/classes/${classId}/subjects/${subjectId}/grades`);
    return response.data?.grades || response.data?.data || response.data || [];
  },

  saveClassGrades: async (classId: string, subjectId: string, gradesData: any[]) => {
    const response = await apiClient.post(`/academic/classes/${classId}/subjects/${subjectId}/grades`, { gradesData });
    return response.data;
  },

  getExams: async () => {
    const response = await apiClient.get('/academic/exams');
    return response.data?.exams || response.data?.data || response.data || [];
  },

  getExamResults: async (classId: string, examId: string) => {
    const response = await apiClient.get(`/academic/exams/${examId}/classes/${classId}/matrix`);
    return response.data?.results || response.data?.data || response.data || [];
  },

  publishExamResults: async (classId: string, examId: string) => {
    const response = await apiClient.post(`/academic/exams/${examId}/classes/${classId}/publish`);
    return response.data;
  },
};

export default academicService;
