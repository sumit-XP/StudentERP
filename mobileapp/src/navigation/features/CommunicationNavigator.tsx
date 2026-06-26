import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AnnouncementsScreen from '../../screens/communication/AnnouncementsScreen';
import MessagesListScreen from '../../screens/communication/MessagesListScreen';
import ChatScreen from '../../screens/communication/ChatScreen';
import PTMScreen from '../../screens/communication/PTMScreen';

export type CommunicationStackParamList = {
  Announcements: undefined;
  MessagesList: undefined;
  Chat: { recipientId: string; recipientName: string };
  PTM: undefined;
};

const Stack = createStackNavigator<CommunicationStackParamList>();

const CommunicationNavigator: React.FC = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="Announcements"
      component={AnnouncementsScreen}
      options={{ title: 'Announcements' }}
    />
    <Stack.Screen
      name="MessagesList"
      component={MessagesListScreen}
      options={{ title: 'Messages' }}
    />
    <Stack.Screen
      name="Chat"
      component={ChatScreen}
      options={({ route }) => ({ title: route.params.recipientName })}
    />
    <Stack.Screen name="PTM" component={PTMScreen} options={{ title: 'Parent-Teacher Meetings' }} />
  </Stack.Navigator>
);

export default CommunicationNavigator;
