import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

jest.mock('react-native-encrypted-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

const TestConsumer: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return <Text testID="loading">loading</Text>;
  }
  return <Text testID="auth-status">{isAuthenticated ? 'authenticated' : 'unauthenticated'}</Text>;
};

describe('AuthContext', () => {
  it('starts in loading state and resolves to unauthenticated when no token stored', async () => {
    const { getByTestId } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    // Initially shows loading
    expect(getByTestId('loading')).toBeTruthy();

    // After async session restore, resolves to unauthenticated
    await waitFor(() => expect(getByTestId('auth-status')).toBeTruthy(), { timeout: 8000 });
    expect(getByTestId('auth-status').props.children).toBe('unauthenticated');
  }, 10000);
});
