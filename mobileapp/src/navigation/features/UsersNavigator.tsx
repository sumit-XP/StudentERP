import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import UserListScreen from '../../screens/users/UserListScreen';
import StudentProfileScreen from '../../screens/users/StudentProfileScreen';

export type UsersStackParamList = {
  UserList: undefined;
  StudentProfile: { studentId: string; userDetail?: any };
};

const Stack = createStackNavigator<UsersStackParamList>();

const UsersNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="UserList" component={UserListScreen} options={{ title: 'Directory' }} />
    <Stack.Screen
      name="StudentProfile"
      component={StudentProfileScreen}
      options={{ title: 'Student Profile' }}
    />
  </Stack.Navigator>
);

export default UsersNavigator;
