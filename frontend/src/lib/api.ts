import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { parseError, logError } from '../utils/errorHandler';

// Use environment variable for API URL, fallback to relative path
// In development: uses '/api' (proxied by Vite to localhost:3001)
// In production, if using subdirectory: use '/edschool/api'
// If using separate domain/IP: set VITE_API_URL="http://your-ip:3001/api"
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? '/api' : '/edschool/api');

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

// Handle auth errors and improve error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle authentication errors
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/edschool/login';
      return Promise.reject(error);
    }
    
    // Parse and enhance error message using global error handler
    const parsedError = parseError(error);
    error.message = parsedError.message;
    error.code = parsedError.code;
    error.status = parsedError.status;
    
    // Log error for debugging
    logError(error, 'API Request');
    
    return Promise.reject(error);
  }
);

export default api;

