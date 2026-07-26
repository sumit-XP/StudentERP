import authService from '../services/authService';

describe('authService', () => {
  describe('login', () => {
    it('returns mock token and user on login', async () => {
      const result = await authService.login('admin@test.com', 'admin');
      expect(result.token).toContain('mock-jwt-token-for-admin');
      expect(result.user.role).toBe('admin');
    });

    it('returns mock token and user for student role', async () => {
      const result = await authService.login('student@test.com', 'student');
      expect(result.token).toContain('mock-jwt-token-for-student');
      expect(result.user.role).toBe('student');
    });
  });

  describe('logout', () => {
    it('resolves logout successfully', async () => {
      await expect(authService.logout()).resolves.toBeUndefined();
    });
  });
});
