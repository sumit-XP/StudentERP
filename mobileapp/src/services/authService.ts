import apiClient from '../api/client';
import { User } from '../types/index';

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
    const res = await apiClient.post<LoginResponse>('/auth/login', { email, password });

    // Handle both { data: { token, user } } and { token, user } response formats
    const token = res.data.data?.token ?? res.data.token;
    const user = res.data.data?.user ?? res.data.user;

    if (!token || !user) {
      throw new Error('Invalid login response from server');
    }

    return { token, user };
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Continue even if server logout fails (e.g. network error)
      // The client will still clear the local token
    }
  },
};

export default authService;
