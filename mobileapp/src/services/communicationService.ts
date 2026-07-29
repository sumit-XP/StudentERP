import apiClient from '../api/client';

export const communicationService = {
  getAnnouncements: async () => {
    const response = await apiClient.get('/communication/announcements');
    return response.data?.announcements || response.data?.data || (Array.isArray(response.data) ? response.data : []);
  },

  getMessages: async (otherUserId?: string) => {
    if (!otherUserId) return [];
    const response = await apiClient.get(`/communication/messages?otherUserId=${encodeURIComponent(otherUserId)}`);
    return response.data?.messages || response.data?.data || (Array.isArray(response.data) ? response.data : []);
  },

  getConversations: async () => {
    const response = await apiClient.get('/communication/conversations');
    return response.data?.conversations || response.data?.data || (Array.isArray(response.data) ? response.data : []);
  },

  sendMessage: async (receiverId: string, messageText: string) => {
    const response = await apiClient.post('/communication/messages', { receiverId, messageText });
    return response.data?.messageData || response.data?.data || response.data;
  },

  getRecipients: async (search?: string, role?: string, limit: number = 50) => {
    const queryParts: string[] = [];
    if (search) queryParts.push(`search=${encodeURIComponent(search)}`);
    if (role && role !== 'all' && role !== 'All') queryParts.push(`role=${encodeURIComponent(role.toLowerCase())}`);
    if (limit) queryParts.push(`limit=${encodeURIComponent(String(limit))}`);
    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const response = await apiClient.get(`/communication/recipients${queryString}`);
    return response.data?.users || response.data?.data || (Array.isArray(response.data) ? response.data : []);
  },

  getNotifications: async () => {
    const response = await apiClient.get('/communication/notifications');
    return response.data?.notifications || response.data?.data || (Array.isArray(response.data) ? response.data : []);
  },

  markNotificationAsRead: async (notificationId: string) => {
    const response = await apiClient.put(`/communication/notifications/${notificationId}/read`);
    return response.data?.data || response.data;
  }
};

export default communicationService;
