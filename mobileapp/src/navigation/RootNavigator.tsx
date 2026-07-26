import React, { useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import LoginScreen from '../screens/auth/LoginScreen';
import AdminTabs from './tabs/AdminTabs';
import TeacherTabs from './tabs/TeacherTabs';
import StudentTabs from './tabs/StudentTabs';
import ParentTabs from './tabs/ParentTabs';
import AnimatedSplashScreen from '../screens/AnimatedSplashScreen';

const Stack = createStackNavigator();

const RootNavigator: React.FC = () => {
  const { isLoading, isAuthenticated, user } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <AnimatedSplashScreen onAnimationFinish={() => setShowSplash(false)} />;
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const getAppScreen = () => {
    const role = user?.role?.toLowerCase();

    switch (role) {
      case 'admin':
        return <Stack.Screen name="App" component={AdminTabs} navigationKey={role} />;
      case 'teacher':
        return <Stack.Screen name="App" component={TeacherTabs} navigationKey={role} />;
      case 'parent':
        return <Stack.Screen name="App" component={ParentTabs} navigationKey={role} />;
      case 'student':
      default:
        return (
          <Stack.Screen name="App" component={StudentTabs} navigationKey={role ?? 'student'} />
        );
    }
  };

  return (
    <NavigationContainer
      // Auth transitions must create a fresh navigator tree. Reusing the previous
      // tree can leave the tab bar attached to the route state from the login flow.
      key={`${isAuthenticated ? 'app' : 'auth'}-${user?.role?.toLowerCase() ?? ''}`}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? getAppScreen() : <Stack.Screen name="Auth" component={LoginScreen} />}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default RootNavigator;
