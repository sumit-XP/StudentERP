import authService from '../services/authService';
import apiClient from '../api/client';

jest.mock('../api/client', () => ({
  post: jest.fn(),
}));

describe('authService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('returns token and user on successful login (data wrapper format)', async () => {
      const mockResponse = {
        data: {
          data: {
            token: 'test-token',
            user: { id: '1', role: 'student', email: 'test@test.com' },
          },
        },
      };
      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authService.login('test@test.com', 'password');

      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@test.com',
        password: 'password',
      });
      expect(result).toEqual({
        token: 'test-token',
        user: { id: '1', role: 'student', email: 'test@test.com' },
      });
    });

    it('returns token and user on successful login (flat format)', async () => {
      const mockResponse = {
        data: {
          token: 'flat-token',
          user: { id: '2', role: 'admin', email: 'admin@test.com' },
        },
      };
      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authService.login('admin@test.com', 'admin');

      expect(result).toEqual({
        token: 'flat-token',
        user: { id: '2', role: 'admin', email: 'admin@test.com' },
      });
    });

    it('throws error if response is missing token or user', async () => {
      const mockResponse = { data: {} };
      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      await expect(authService.login('test@test.com', 'password')).rejects.toThrow(
        'Invalid login response from server',
      );
    });

    it('throws error if API call fails', async () => {
      (apiClient.post as jest.Mock).mockRejectedValue(new Error('Network Error'));

      await expect(authService.login('test@test.com', 'password')).rejects.toThrow('Network Error');
    });
  });

  describe('logout', () => {
    it('calls /auth/logout', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue({ data: {} });

      await authService.logout();

      expect(apiClient.post).toHaveBeenCalledWith('/auth/logout');
    });

    it('swallows errors when logout API fails', async () => {
      (apiClient.post as jest.Mock).mockRejectedValue(new Error('Network Error'));

      await expect(authService.logout()).resolves.toBeUndefined();
    });
  });
});
