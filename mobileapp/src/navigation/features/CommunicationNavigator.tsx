import React from 'react';
import MessagingNavigator, { MessagingStackParamList } from './MessagingNavigator';
import AnnouncementsNavigator, { AnnouncementsStackParamList } from './AnnouncementsNavigator';

export type CommunicationStackParamList = {
  Announcements: undefined;
  MessagesList: undefined;
  Chat: { recipientId: string; recipientName: string };
  PTM: undefined;
};

export { AnnouncementsNavigator, MessagingNavigator };
export default MessagingNavigator;
