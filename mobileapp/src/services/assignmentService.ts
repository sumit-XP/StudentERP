import apiClient from '../api/client';

export const assignmentService = {
  getAssignments: async () => {
    // If we have a role of student/parent, it could be /assignments/my-assignments, but for simplicity assuming /assignments
    const response = await apiClient.get('/assignments');
    return response.data?.data || response.data;
  },

  getAssignmentDetails: async (assignmentId: string) => {
    const response = await apiClient.get(`/assignments/${assignmentId}`);
    return response.data?.data || response.data;
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
