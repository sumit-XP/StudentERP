import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardNavigator from '../features/DashboardNavigator';
import FeesNavigator from '../features/FeesNavigator';
import ParentPortalScreen from '../../screens/dashboards/ParentPortalScreen';
import ProfileNavigator from '../features/ProfileNavigator';
import { DashboardIcon, WalletIcon, MessageIcon, ProfileIcon } from '../../assets/svgs';

export type ParentTabsParamList = {
  DashboardTab: undefined;
  FeesTab: undefined;
  ParentPortalTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<ParentTabsParamList>();

const ParentTabs: React.FC = () => {
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
          } else if (route.name === 'FeesTab') {
            return <WalletIcon size={size} color={color} />;
          } else if (route.name === 'ParentPortalTab') {
            return <MessageIcon size={size} color={color} />;
          } else if (route.name === 'ProfileTab') {
            return <ProfileIcon size={size} color={color} />;
          }
          return null;
        },
        tabBarActiveTintColor: '#f57c00',
        tabBarInactiveTintColor: '#737686',
        sceneContainerStyle: { backgroundColor: '#f8f9ff' },
      })}
    >
      <Tab.Screen name="DashboardTab" component={DashboardNavigator} options={{ title: 'Home' }} />
      <Tab.Screen name="FeesTab" component={FeesNavigator} options={{ title: 'Fees' }} />
      <Tab.Screen
        name="ParentPortalTab"
        component={ParentPortalScreen}
        options={{ title: 'Parent Portal' }}
      />
      <Tab.Screen name="ProfileTab" component={ProfileNavigator} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
};

export default ParentTabs;
