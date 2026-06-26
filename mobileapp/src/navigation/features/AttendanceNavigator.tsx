import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MarkAttendanceScreen from '../../screens/attendance/MarkAttendanceScreen';
import AttendanceHistoryScreen from '../../screens/attendance/AttendanceHistoryScreen';
import AttendanceReportsScreen from '../../screens/attendance/AttendanceReportsScreen';

export type AttendanceStackParamList = {
  MarkAttendance: undefined;
  AttendanceHistory: undefined;
  AttendanceReports: undefined;
};

const Stack = createStackNavigator<AttendanceStackParamList>();

const AttendanceNavigator: React.FC = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="MarkAttendance"
      component={MarkAttendanceScreen}
      options={{ title: 'Mark Attendance' }}
    />
    <Stack.Screen
      name="AttendanceHistory"
      component={AttendanceHistoryScreen}
      options={{ title: 'My Attendance' }}
    />
    <Stack.Screen
      name="AttendanceReports"
      component={AttendanceReportsScreen}
      options={{ title: 'Reports' }}
    />
  </Stack.Navigator>
);

export default AttendanceNavigator;
