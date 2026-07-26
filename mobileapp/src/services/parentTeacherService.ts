import apiClient from '../api/client';

export const parentTeacherService = {
  getUpcomingPTMs: async () => {
    const response = await apiClient.get('/parent-teacher/ptm/upcoming');
    return response.data?.data || response.data;
  },

  schedulePTM: async (teacherId: string, scheduledAt: string, purpose: string) => {
    const response = await apiClient.post('/parent-teacher/ptm/schedule', { teacherId, scheduledAt, purpose });
    return response.data?.data || response.data;
  }
};

export default parentTeacherService;
