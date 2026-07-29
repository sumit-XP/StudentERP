import apiClient from '../api/client';

export const userService = {
  getUsers: async () => {
    try {
      const [studentsRes, teachersRes, staffRes] = await Promise.allSettled([
        apiClient.get('/academic/students'),
        apiClient.get('/academic/teachers'),
        apiClient.get('/hr/staff'),
      ]);

      const allUsers: any[] = [];

      if (studentsRes.status === 'fulfilled' && studentsRes.value?.data) {
        const students = studentsRes.value.data.students || studentsRes.value.data.data || [];
        if (Array.isArray(students)) {
          students.forEach((s: any) => {
            allUsers.push({
              ...s,
              role: 'Student',
              name: s.name || s.student_name || `Student ${s.student_id || s.id}`,
            });
          });
        }
      }

      if (teachersRes.status === 'fulfilled' && teachersRes.value?.data) {
        const teachers = teachersRes.value.data.teachers || teachersRes.value.data.data || [];
        if (Array.isArray(teachers)) {
          teachers.forEach((t: any) => {
            allUsers.push({
              ...t,
              role: 'Teacher',
              name: t.name || `Prof. ${t.last_name || t.employee_id || t.id}`,
            });
          });
        }
      }

      if (staffRes.status === 'fulfilled' && staffRes.value?.data) {
        const staff = staffRes.value.data.staff || staffRes.value.data.data || [];
        if (Array.isArray(staff)) {
          staff.forEach((st: any) => {
            allUsers.push({
              ...st,
              role: 'Staff',
              name: st.name || `Staff ${st.employee_id || st.id}`,
            });
          });
        }
      }

      return allUsers;
    } catch (e) {
      console.error('Error in userService.getUsers:', e);
      return [];
    }
  },
};

export default userService;
