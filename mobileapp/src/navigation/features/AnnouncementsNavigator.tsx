import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AnnouncementsScreen from '../../screens/communication/AnnouncementsScreen';
import CreateAnnouncementScreen from '../../screens/communication/CreateAnnouncementScreen';

export type AnnouncementsStackParamList = {
  Announcements: undefined;
  CreateAnnouncement: undefined;
};

const Stack = createStackNavigator<AnnouncementsStackParamList>();

const AnnouncementsNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen
      name="Announcements"
      component={AnnouncementsScreen}
      options={{ title: 'School Bulletins & Announcements' }}
    />
    <Stack.Screen
      name="CreateAnnouncement"
      component={CreateAnnouncementScreen}
      options={{ title: 'Post Announcement' }}
    />
  </Stack.Navigator>
);

export default AnnouncementsNavigator;
