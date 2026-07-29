import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
import { Platform } from 'react-native';

// For wired connection via USB, Android emulator (10.0.2.2), or local network:
const DEFAULT_HOST = Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';
const API_BASE_URL = process.env.API_BASE_URL || DEFAULT_HOST;

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await EncryptedStorage.getItem('auth_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // token retrieval failed — proceed without
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// Response interceptor — normalise errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    const message = (error.response?.data as { message?: string })?.message || error.message;
    return Promise.reject(new Error(message));
  },
);

export default apiClient;
