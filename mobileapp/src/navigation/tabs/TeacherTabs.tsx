import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardNavigator from '../features/DashboardNavigator';
import AttendanceNavigator from '../features/AttendanceNavigator';
import AssignmentsNavigator from '../features/AssignmentsNavigator';
import AnnouncementsNavigator from '../features/AnnouncementsNavigator';
import MessagingNavigator from '../features/MessagingNavigator';
import ProfileNavigator from '../features/ProfileNavigator';
import { DashboardIcon, FactCheckIcon, AssignmentIcon, MegaphoneIcon, MessageIcon, ProfileIcon } from '../../assets/svgs';

export type TeacherTabsParamList = {
  DashboardTab: undefined;
  AttendanceTab: undefined;
  AssignmentsTab: undefined;
  AnnouncementsTab: undefined;
  MessagesTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<TeacherTabsParamList>();

const TeacherTabs: React.FC = () => {
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
          }
          if (route.name === 'AttendanceTab') {
            return <FactCheckIcon size={size} color={color} />;
          }
          if (route.name === 'AssignmentsTab') {
            return <AssignmentIcon size={size} color={color} />;
          }
          if (route.name === 'AnnouncementsTab') {
            return <MegaphoneIcon size={size} color={color} />;
          }
          if (route.name === 'MessagesTab') {
            return <MessageIcon size={size} color={color} />;
          }
          if (route.name === 'ProfileTab') {
            return <ProfileIcon size={size} color={color} />;
          }
          return null;
        },
        tabBarActiveTintColor: '#003fb1',
        tabBarInactiveTintColor: '#737686',
        sceneContainerStyle: { backgroundColor: '#f8f9ff' },
      })}
    >
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
      <Tab.Screen
        name="AnnouncementsTab"
        component={AnnouncementsNavigator}
        options={{ title: 'Notices', unmountOnBlur: true }}
      />
      <Tab.Screen
        name="MessagesTab"
        component={MessagingNavigator}
        options={{ title: 'Messages', unmountOnBlur: true }}
      />
      <Tab.Screen name="ProfileTab" component={ProfileNavigator} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
};

export default TeacherTabs;
