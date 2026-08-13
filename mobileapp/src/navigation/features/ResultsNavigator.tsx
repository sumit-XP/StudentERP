import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../../contexts/AuthContext';
import GradingResultsScreen from '../../screens/assignments/GradingResultsScreen';
import AdminResultsOverviewScreen from '../../screens/dashboards/AdminResultsOverviewScreen';
import StudentReportCardScreen from '../../screens/results/StudentReportCardScreen';

export type ResultsStackParamList = {
  ResultsHome: undefined;
};

const Stack = createStackNavigator<ResultsStackParamList>();

const ResultsNavigator: React.FC = () => {
  const { user } = useAuth();

  const ResultsScreen = (() => {
    switch (user?.role?.toLowerCase()) {
      case 'admin':
        return AdminResultsOverviewScreen;
      case 'teacher':
        return GradingResultsScreen;
      default:
        return StudentReportCardScreen;
    }
  })();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="ResultsHome"
        component={ResultsScreen}
        options={{ title: 'Results & Reports' }}
      />
    </Stack.Navigator>
  );
};

export default ResultsNavigator;
