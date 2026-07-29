import apiClient from '../api/client';

export const attendanceService = {
  getMyAttendance: async () => {
    const response = await apiClient.get('/attendance/my-attendance');
    return response.data?.data || response.data;
  },

  getAttendanceReport: async (params?: any) => {
    const response = await apiClient.get('/attendance/report', { params });
    return response.data?.data || response.data;
  },

  getAttendanceByClassAndDate: async (classId: string, date: string, subjectId?: string) => {
    const response = await apiClient.get('/attendance/class', {
      params: { classId, date, subjectId },
    });
    return response.data;
  },

  markAttendance: async (attendanceData: any[]) => {
    const response = await apiClient.post('/attendance/mark', { attendanceData });
    return response.data;
  },

  getClassAttendanceSummary: async (classId?: string, month?: number, year?: number) => {
    const response = await apiClient.get('/attendance/class-summary', {
      params: { classId, month, year },
    });
    return response.data;
  },
};

export default attendanceService;
