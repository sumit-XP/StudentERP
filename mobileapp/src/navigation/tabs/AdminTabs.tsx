import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardNavigator from '../features/DashboardNavigator';
import UsersNavigator from '../features/UsersNavigator';
import AnnouncementsNavigator from '../features/AnnouncementsNavigator';
import MessagingNavigator from '../features/MessagingNavigator';
import ProfileNavigator from '../features/ProfileNavigator';
import { DashboardIcon, UsersIcon, MegaphoneIcon, MessageIcon, ProfileIcon } from '../../assets/svgs';

export type AdminTabsParamList = {
  DashboardTab: undefined;
  UsersTab: undefined;
  AnnouncementsTab: undefined;
  MessagesTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<AdminTabsParamList>();

const AdminTabs: React.FC = () => {
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
          } else if (route.name === 'UsersTab') {
            return <UsersIcon size={size} color={color} />;
          } else if (route.name === 'AnnouncementsTab') {
            return <MegaphoneIcon size={size} color={color} />;
          } else if (route.name === 'MessagesTab') {
            return <MessageIcon size={size} color={color} />;
          } else if (route.name === 'ProfileTab') {
            return <ProfileIcon size={size} color={color} />;
          }
          return null;
        },
        tabBarActiveTintColor: '#6200ea',
        tabBarInactiveTintColor: '#737686',
        sceneContainerStyle: { backgroundColor: '#f8f9ff' },
      })}
    >
      <Tab.Screen name="DashboardTab" component={DashboardNavigator} options={{ title: 'Home' }} />
      <Tab.Screen
        name="UsersTab"
        component={UsersNavigator}
        options={{ title: 'Users', unmountOnBlur: true }}
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
      <Tab.Screen
        name="ProfileTab"
        component={ProfileNavigator}
        options={{ title: 'Profile', unmountOnBlur: true }}
      />
    </Tab.Navigator>
  );
};

export default AdminTabs;
