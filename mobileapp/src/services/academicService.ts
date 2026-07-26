import apiClient from '../api/client';

export const academicService = {
  getStudentGuardians: async (studentId: string) => {
    const response = await apiClient.get(`/academic/students/${studentId}/guardians`);
    return response.data?.data || response.data;
  },

  getStudentDocuments: async (studentId: string) => {
    const response = await apiClient.get(`/academic/students/${studentId}/documents`);
    return response.data?.data || response.data;
  }
};

export default academicService;
