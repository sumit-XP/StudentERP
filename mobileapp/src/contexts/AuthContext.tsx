import React, { createContext, useContext, useEffect, useReducer } from 'react';
import EncryptedStorage from 'react-native-encrypted-storage';
import { AuthState, User } from '../types/index';

type AuthAction =
  | { type: 'RESTORE_TOKEN'; token: string | null; user: User | null }
  | { type: 'SIGN_IN'; token: string; user: User }
  | { type: 'SIGN_OUT' };

interface AuthContextType extends AuthState {
  signIn: (token: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'RESTORE_TOKEN':
      return {
        ...state,
        token: action.token,
        user: action.user,
        isLoading: false,
        isAuthenticated: !!action.token,
      };
    case 'SIGN_IN':
      return {
        ...state,
        token: action.token,
        user: action.user,
        isLoading: false,
        isAuthenticated: true,
      };
    case 'SIGN_OUT':
      return { ...state, token: null, user: null, isLoading: false, isAuthenticated: false };
    default:
      return state;
  }
};

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = await EncryptedStorage.getItem('auth_token');
        const userJson = await EncryptedStorage.getItem('auth_user');
        const user: User | null = userJson ? (JSON.parse(userJson) as User) : null;
        dispatch({ type: 'RESTORE_TOKEN', token: token ?? null, user });
      } catch {
        dispatch({ type: 'RESTORE_TOKEN', token: null, user: null });
      }
    };
    restoreSession();
  }, []);

  const signIn = async (token: string, user: User): Promise<void> => {
    await EncryptedStorage.setItem('auth_token', token);
    await EncryptedStorage.setItem('auth_user', JSON.stringify(user));
    dispatch({ type: 'SIGN_IN', token, user });
  };

  const signOut = async (): Promise<void> => {
    await EncryptedStorage.removeItem('auth_token');
    await EncryptedStorage.removeItem('auth_user');
    dispatch({ type: 'SIGN_OUT' });
  };

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut }}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};

export default AuthContext;
