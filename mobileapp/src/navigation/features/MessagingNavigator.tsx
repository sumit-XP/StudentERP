import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MessagingScreen from '../../screens/communication/MessagingScreen';
import ChatScreen from '../../screens/communication/ChatScreen';
import PTMScreen from '../../screens/communication/PTMScreen';

export type MessagingStackParamList = {
  MessagingInbox: undefined;
  Chat: { recipientId: string; recipientName: string };
  PTM: undefined;
};

const Stack = createStackNavigator<MessagingStackParamList>();

const MessagingNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen
      name="MessagingInbox"
      component={MessagingScreen}
      options={{ title: 'Messages & Conversations' }}
    />
    <Stack.Screen
      name="Chat"
      component={ChatScreen}
      options={({ route }) => ({ title: route.params.recipientName })}
    />
    <Stack.Screen
      name="PTM"
      component={PTMScreen}
      options={{ title: 'Parent-Teacher Meetings' }}
    />
  </Stack.Navigator>
);

export default MessagingNavigator;
