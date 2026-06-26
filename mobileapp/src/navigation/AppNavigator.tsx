import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/index';
import AdminTabs from './tabs/AdminTabs';
import TeacherTabs from './tabs/TeacherTabs';
import ParentTabs from './tabs/ParentTabs';
import StudentTabs from './tabs/StudentTabs';

const AppNavigator: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1565c0" />
      </View>
    );
  }

  const role: UserRole = user.role;

  switch (role) {
    case 'admin':
      return <AdminTabs />;
    case 'teacher':
      return <TeacherTabs />;
    case 'parent':
      return <ParentTabs />;
    case 'student':
    default:
      return <StudentTabs />;
  }
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
});

export default AppNavigator;
