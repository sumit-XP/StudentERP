import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../../contexts/AuthContext';
import AdminDashboard from '../../screens/dashboards/AdminDashboard';
import TeacherDashboard from '../../screens/dashboards/TeacherDashboard';
import ParentDashboard from '../../screens/dashboards/ParentDashboard';
import StudentDashboard from '../../screens/dashboards/StudentDashboard';

export type DashboardStackParamList = {
  Overview: undefined;
};

const Stack = createStackNavigator<DashboardStackParamList>();

const DashboardNavigator: React.FC = () => {
  const { user } = useAuth();

  const DashboardScreen = (() => {
    switch (user?.role) {
      case 'admin':
        return AdminDashboard;
      case 'teacher':
        return TeacherDashboard;
      case 'parent':
        return ParentDashboard;
      default:
        return StudentDashboard;
    }
  })();

  return (
    <Stack.Navigator>
      <Stack.Screen name="Overview" component={DashboardScreen} options={{ title: 'Dashboard' }} />
    </Stack.Navigator>
  );
};

export default DashboardNavigator;
