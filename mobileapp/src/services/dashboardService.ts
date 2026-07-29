import apiClient from '../api/client';

export const dashboardService = {
  getDashboardAnalytics: async () => {
    const response = await apiClient.get('/analytics/dashboard');
    return response.data?.overview || response.data;
  },

  getAttendanceAnalytics: async (groupBy = 'day') => {
    const response = await apiClient.get(`/analytics/attendance?groupBy=${groupBy}`);
    return response.data?.attendanceAnalytics || response.data;
  },
};

export default dashboardService;
