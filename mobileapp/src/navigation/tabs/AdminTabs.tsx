import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardNavigator from '../features/DashboardNavigator';
import UsersNavigator from '../features/UsersNavigator';
import FeesNavigator from '../features/FeesNavigator';
import ProfileNavigator from '../features/ProfileNavigator';

export type AdminTabsParamList = {
  DashboardTab: undefined;
  UsersTab: undefined;
  FeesTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<AdminTabsParamList>();

const AdminTabs: React.FC = () => {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="DashboardTab" component={DashboardNavigator} options={{ title: 'Home' }} />
      <Tab.Screen name="UsersTab" component={UsersNavigator} options={{ title: 'Users' }} />
      <Tab.Screen name="FeesTab" component={FeesNavigator} options={{ title: 'Fees' }} />
      <Tab.Screen name="ProfileTab" component={ProfileNavigator} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
};

export default AdminTabs;
