import apiClient from '../api/client';

export const profileService = {
  getProfile: async () => {
    const response = await apiClient.get('/auth/profile');
    return response.data?.data || response.data;
  },

  updateProfile: async (data: { name: string; phone: string }) => {
    const response = await apiClient.put('/auth/profile', data);
    return response.data?.data || response.data;
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const response = await apiClient.put('/auth/change-password', data);
    return response.data;
  }
};

export default profileService;
