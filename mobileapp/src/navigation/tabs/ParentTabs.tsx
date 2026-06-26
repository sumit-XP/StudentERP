import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardNavigator from '../features/DashboardNavigator';
import FeesNavigator from '../features/FeesNavigator';
import CommunicationNavigator from '../features/CommunicationNavigator';
import ProfileNavigator from '../features/ProfileNavigator';

export type ParentTabsParamList = {
  DashboardTab: undefined;
  FeesTab: undefined;
  CommunicationTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<ParentTabsParamList>();

const ParentTabs: React.FC = () => {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="DashboardTab" component={DashboardNavigator} options={{ title: 'Home' }} />
      <Tab.Screen name="FeesTab" component={FeesNavigator} options={{ title: 'Fees' }} />
      <Tab.Screen
        name="CommunicationTab"
        component={CommunicationNavigator}
        options={{ title: 'Comms' }}
      />
      <Tab.Screen name="ProfileTab" component={ProfileNavigator} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
};

export default ParentTabs;
