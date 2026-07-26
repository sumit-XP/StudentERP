import apiClient from '../api/client';

export const communicationService = {
  getAnnouncements: async () => {
    const response = await apiClient.get('/communication/announcements');
    return response.data?.data || response.data;
  },

  getMessages: async () => {
    const response = await apiClient.get('/communication/messages');
    return response.data?.data || response.data;
  },

  getConversations: async () => {
    const response = await apiClient.get('/communication/conversations');
    return response.data?.data || response.data;
  },

  sendMessage: async (recipientId: string, content: string) => {
    const response = await apiClient.post('/communication/messages', { recipientId, content });
    return response.data?.data || response.data;
  },

  getNotifications: async () => {
    const response = await apiClient.get('/communication/notifications');
    return response.data?.data || response.data;
  },

  markNotificationAsRead: async (notificationId: string) => {
    const response = await apiClient.put(`/communication/notifications/${notificationId}/read`);
    return response.data?.data || response.data;
  }
};

export default communicationService;
