import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../../contexts/AuthContext';
import AdminDashboard from '../../screens/dashboards/AdminDashboard';
import TeacherDashboard from '../../screens/dashboards/TeacherDashboard';
import ParentDashboard from '../../screens/dashboards/ParentDashboard';
import StudentDashboard from '../../screens/dashboards/StudentDashboard';
import GradingResultsScreen from '../../screens/assignments/GradingResultsScreen';
import AssignHomeworkScreen from '../../screens/assignments/AssignHomeworkScreen';
import CreateAnnouncementScreen from '../../screens/communication/CreateAnnouncementScreen';
import AnnouncementsScreen from '../../screens/communication/AnnouncementsScreen';
import AdminResultsOverviewScreen from '../../screens/dashboards/AdminResultsOverviewScreen';
import AdminAttendanceOverviewScreen from '../../screens/dashboards/AdminAttendanceOverviewScreen';
import StudentPaymentsScreen from '../../screens/fees/StudentPaymentsScreen';
import MessagingScreen from '../../screens/communication/MessagingScreen';
import TeacherScheduleScreen from '../../screens/schedule/TeacherScheduleScreen';
import StudentScheduleScreen from '../../screens/schedule/StudentScheduleScreen';
import StudentAttendanceScreen from '../../screens/attendance/StudentAttendanceScreen';
import StudentReportCardScreen from '../../screens/results/StudentReportCardScreen';
import MarkAttendanceScreen from '../../screens/attendance/MarkAttendanceScreen';
import UserListScreen from '../../screens/users/UserListScreen';

export type DashboardStackParamList = {
  Overview: undefined;
  GradingResults: undefined;
  AssignHomework: undefined;
  CreateAnnouncement: undefined;
  Announcements: undefined;
  AdminResultsOverview: undefined;
  AdminAttendanceOverview: undefined;
  StudentPayments: undefined;
  Messaging: undefined;
  TeacherSchedule: undefined;
  StudentSchedule: undefined;
  StudentAttendance: undefined;
  StudentReportCard: undefined;
  MarkAttendance: undefined;
  UserList: undefined;
};

const Stack = createStackNavigator<DashboardStackParamList>();

const DashboardNavigator: React.FC = () => {
  const { user } = useAuth();

  const DashboardScreen = (() => {
    switch (user?.role?.toLowerCase()) {
      case 'admin':
        return AdminDashboard;
      case 'teacher':
        return TeacherDashboard;
      case 'parent':
        return ParentDashboard;
      default:
        return StudentDashboard;
    }
  })();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="Overview"
        component={DashboardScreen}
        options={{ title: 'Dashboard', headerShown: false }}
      />
      <Stack.Screen
        name="GradingResults"
        component={GradingResultsScreen}
        options={{ title: 'Grading & Results' }}
      />
      <Stack.Screen
        name="AssignHomework"
        component={AssignHomeworkScreen}
        options={{ title: 'Assign Homework' }}
      />
      <Stack.Screen
        name="CreateAnnouncement"
        component={CreateAnnouncementScreen}
        options={{ title: 'Broadcast Announcement' }}
      />
      <Stack.Screen
        name="Announcements"
        component={AnnouncementsScreen}
        options={{ title: 'Announcements' }}
      />
      <Stack.Screen
        name="AdminResultsOverview"
        component={AdminResultsOverviewScreen}
        options={{ title: 'Student Results' }}
      />
      <Stack.Screen
        name="AdminAttendanceOverview"
        component={AdminAttendanceOverviewScreen}
        options={{ title: 'Class Attendance' }}
      />
      <Stack.Screen
        name="StudentPayments"
        component={StudentPaymentsScreen}
        options={{ title: 'Payments Portal' }}
      />
      <Stack.Screen
        name="Messaging"
        component={MessagingScreen}
        options={{ title: 'Messages' }}
      />
      <Stack.Screen
        name="TeacherSchedule"
        component={TeacherScheduleScreen}
        options={{ title: 'My Schedule' }}
      />
      <Stack.Screen
        name="StudentSchedule"
        component={StudentScheduleScreen}
        options={{ title: 'Class Schedule' }}
      />
      <Stack.Screen
        name="StudentAttendance"
        component={StudentAttendanceScreen}
        options={{ title: 'My Attendance' }}
      />
      <Stack.Screen
        name="StudentReportCard"
        component={StudentReportCardScreen}
        options={{ title: 'Report Card' }}
      />
      <Stack.Screen
        name="MarkAttendance"
        component={MarkAttendanceScreen}
        options={{ title: 'Mark Attendance' }}
      />
      <Stack.Screen
        name="UserList"
        component={UserListScreen}
        options={{ title: 'User Management' }}
      />
    </Stack.Navigator>
  );
};

export default DashboardNavigator;
