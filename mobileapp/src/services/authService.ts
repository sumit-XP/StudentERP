import apiClient from '../api/client';
import { User, UserRole } from '../types/index';

interface LoginResponse {
  data?: {
    token: string;
    user: User;
  };
  token?: string;
  user?: User;
}

export const authService = {
  login: async (email: string, password: string): Promise<{ token: string; user: User }> => {
    const response = await apiClient.post<{ data?: { token: string; user: User }, token?: string, user?: User }>('/auth/login', { email, password });
    
    // Handle both possible structures (data.token vs token directly)
    if (response.data.data?.token && response.data.data?.user) {
      return { token: response.data.data.token, user: response.data.data.user };
    } else if (response.data.token && response.data.user) {
      return { token: response.data.token, user: response.data.user };
    }
    
    throw new Error('Invalid response from server');
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },
};

export default authService;
