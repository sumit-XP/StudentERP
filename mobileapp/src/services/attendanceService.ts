import apiClient from '../api/client';

export const attendanceService = {
  getMyAttendance: async () => {
    const response = await apiClient.get('/attendance/my-attendance');
    return response.data?.data || response.data;
  },

  getAttendanceReport: async (params?: any) => {
    const response = await apiClient.get('/attendance/report', { params });
    return response.data?.data || response.data;
  }
};

export default attendanceService;
