import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardNavigator from '../features/DashboardNavigator';
import AssignmentsNavigator from '../features/AssignmentsNavigator';
import ParentDashboard from '../../screens/dashboards/ParentDashboard';
import AnnouncementsScreen from '../../screens/communication/AnnouncementsScreen';
import ProfileNavigator from '../features/ProfileNavigator';
import { DashboardIcon, AssignmentIcon, MessageIcon, ProfileIcon, MegaphoneIcon } from '../../assets/svgs';

export type StudentTabsParamList = {
  DashboardTab: undefined;
  AssignmentsTab: undefined;
  AnnouncementsTab: undefined;
  ParentPortalTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<StudentTabsParamList>();

const StudentTabs: React.FC = () => {
  return (
    <Tab.Navigator
      initialRouteName="DashboardTab"
      screenListeners={({ route, navigation }) => ({
        tabPress: (event) => {
          if (navigation.isFocused()) {
            return;
          }

          event.preventDefault();
          navigation.navigate(route.name);
        },
      })}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#eef0f6',
          height: Platform.OS === 'ios' ? 85 : 68,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          paddingTop: 10,
          elevation: 20,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'DashboardTab') {
            return <DashboardIcon size={size} color={color} />;
          } else if (route.name === 'AssignmentsTab') {
            return <AssignmentIcon size={size} color={color} />;
          } else if (route.name === 'AnnouncementsTab') {
            return <MegaphoneIcon size={size} color={color} />;
          } else if (route.name === 'ParentPortalTab') {
            return <MessageIcon size={size} color={color} />;
          } else if (route.name === 'ProfileTab') {
            return <ProfileIcon size={size} color={color} />;
          }
          return null;
        },
        tabBarActiveTintColor: '#1565c0',
        tabBarInactiveTintColor: '#737686',
        sceneContainerStyle: { backgroundColor: '#f8f9ff' },
      })}
    >
      <Tab.Screen name="DashboardTab" component={DashboardNavigator} options={{ title: 'Home' }} />
      <Tab.Screen
        name="AssignmentsTab"
        component={AssignmentsNavigator}
        options={{ title: 'Assignments' }}
      />
      <Tab.Screen
        name="AnnouncementsTab"
        component={AnnouncementsScreen}
        options={{ title: 'Announcements' }}
      />
      <Tab.Screen
        name="ParentPortalTab"
        component={ParentDashboard}
        options={{ title: 'Parent Portal' }}
      />
      <Tab.Screen name="ProfileTab" component={ProfileNavigator} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
};

export default StudentTabs;
