// Mock EncryptedStorage before any module import (jest.mock is hoisted automatically)
jest.mock('react-native-encrypted-storage', () => ({
  getItem: jest.fn().mockResolvedValue('mock-jwt-token'),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

import apiClient from '../api/client';

describe('API Client', () => {
  it('should be an axios instance with correct baseURL', () => {
    expect(apiClient.defaults.baseURL).toBeDefined();
    expect(apiClient.defaults.timeout).toBe(10000);
  });

  it('should have request and response interceptors', () => {
    // @ts-expect-error — accessing internal handlers for test
    expect(apiClient.interceptors.request.handlers.length).toBeGreaterThan(0);
    // @ts-expect-error — accessing internal handlers for test
    expect(apiClient.interceptors.response.handlers.length).toBeGreaterThan(0);
  });
});
