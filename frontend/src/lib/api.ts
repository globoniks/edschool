import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Use environment variable for API URL, fallback to relative path
// In production, if using subdirectory: use '/edschool/api'
// If using separate domain/IP: set VITE_API_URL="http://your-ip:3001/api"
const API_BASE_URL = import.meta.env.VITE_API_URL || '/edschool/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/edschool/login';
    }
    return Promise.reject(error);
  }
);

export default api;

