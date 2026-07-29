import apiClient from '../api/client';

export const assignmentService = {
  getMyAssignments: async () => {
    try {
      const response = await apiClient.get('/assignments/my-assignments');
      return response.data?.assignments || response.data?.data || response.data || [];
    } catch {
      return [];
    }
  },

  getAssignments: async (params?: { classId?: string; subjectId?: string; teacherId?: string }) => {
    try {
      const response = await apiClient.get('/assignments', { params });
      return response.data?.assignments || response.data?.data || response.data || [];
    } catch {
      try {
        const response = await apiClient.get('/assignments/my-assignments');
        return response.data?.assignments || response.data?.data || response.data || [];
      } catch {
        return [];
      }
    }
  },

  createAssignment: async (payload: {
    title: string;
    description?: string;
    classId: string;
    subjectId: string;
    dueDate?: string;
    maxMarks?: number;
    fileUrl?: string;
    instructions?: string;
  }) => {
    const response = await apiClient.post('/assignments', payload);
    return response.data?.assignment || response.data?.data || response.data;
  },

  getAssignmentDetails: async (assignmentId: string) => {
    const response = await apiClient.get(`/assignments/${assignmentId}`);
    return response.data?.assignment || response.data?.data || response.data;
  },

  submitAssignment: async (assignmentId: string, notes: string) => {
    const response = await apiClient.post('/assignments/submit', { assignmentId, notes });
    return response.data?.data || response.data;
  },

  gradeSubmission: async (submissionId: string, grade: string, feedback: string) => {
    const response = await apiClient.put(`/assignments/submissions/${submissionId}/grade`, { grade, feedback });
    return response.data?.data || response.data;
  }
};

export default assignmentService;
