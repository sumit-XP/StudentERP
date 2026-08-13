import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ParentDashboard from '../../screens/dashboards/ParentDashboard';
import StudentReportCardScreen from '../../screens/results/StudentReportCardScreen';
import AnnouncementsScreen from '../../screens/communication/AnnouncementsScreen';
import MessagingScreen from '../../screens/communication/MessagingScreen';
import StudentPaymentsScreen from '../../screens/fees/StudentPaymentsScreen';

const Stack = createStackNavigator();

const ParentPortalNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ParentDashboard" component={ParentDashboard} />
    <Stack.Screen name="StudentReportCard" component={StudentReportCardScreen} />
    <Stack.Screen name="Announcements" component={AnnouncementsScreen} />
    <Stack.Screen name="Messaging" component={MessagingScreen} />
    <Stack.Screen name="StudentPayments" component={StudentPaymentsScreen} />
  </Stack.Navigator>
);

export default ParentPortalNavigator;
