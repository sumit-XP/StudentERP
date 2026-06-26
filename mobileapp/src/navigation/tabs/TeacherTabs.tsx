import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardNavigator from '../features/DashboardNavigator';
import AttendanceNavigator from '../features/AttendanceNavigator';
import AssignmentsNavigator from '../features/AssignmentsNavigator';
import ProfileNavigator from '../features/ProfileNavigator';

export type TeacherTabsParamList = {
  DashboardTab: undefined;
  AttendanceTab: undefined;
  AssignmentsTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<TeacherTabsParamList>();

const TeacherTabs: React.FC = () => {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="DashboardTab" component={DashboardNavigator} options={{ title: 'Home' }} />
      <Tab.Screen
        name="AttendanceTab"
        component={AttendanceNavigator}
        options={{ title: 'Attendance' }}
      />
      <Tab.Screen
        name="AssignmentsTab"
        component={AssignmentsNavigator}
        options={{ title: 'Assignments' }}
      />
      <Tab.Screen name="ProfileTab" component={ProfileNavigator} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
};

export default TeacherTabs;
