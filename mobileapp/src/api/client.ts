import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
import { Platform } from 'react-native';

// Ngrok tunnel URL for remote / standalone APK usage
const DEFAULT_HOST = 'https://ambrose-unfulgent-bolsteringly.ngrok-free.dev/api';
const API_BASE_URL = process.env.API_BASE_URL || DEFAULT_HOST;

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
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
