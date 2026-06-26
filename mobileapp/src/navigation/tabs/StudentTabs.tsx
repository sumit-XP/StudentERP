import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardNavigator from '../features/DashboardNavigator';
import AssignmentsNavigator from '../features/AssignmentsNavigator';
import CommunicationNavigator from '../features/CommunicationNavigator';
import ProfileNavigator from '../features/ProfileNavigator';

export type StudentTabsParamList = {
  DashboardTab: undefined;
  AssignmentsTab: undefined;
  CommunicationTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<StudentTabsParamList>();

const StudentTabs: React.FC = () => {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="DashboardTab" component={DashboardNavigator} options={{ title: 'Home' }} />
      <Tab.Screen
        name="AssignmentsTab"
        component={AssignmentsNavigator}
        options={{ title: 'Assignments' }}
      />
      <Tab.Screen
        name="CommunicationTab"
        component={CommunicationNavigator}
        options={{ title: 'Comms' }}
      />
      <Tab.Screen name="ProfileTab" component={ProfileNavigator} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
};

export default StudentTabs;
