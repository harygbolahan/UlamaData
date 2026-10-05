import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { getDeviceInfo, getDeviceSignature } from './device';

const BASE_URL = 'https://ulamadata.ng/app';

// Create axios instance
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const LOG_SEPARATOR = '==================================================';

// Helper to safely format JSON for logging
const formatLogJson = (data) => {
  if (data === undefined || data === null) return 'null';
  try {
    if (typeof data === 'string') {
      return JSON.stringify(JSON.parse(data), null, 2);
    }
    return JSON.stringify(data, null, 2);
  } catch (e) {
    return String(data);
  }
};

// Token held in memory so each request does not wait on AsyncStorage.
// undefined = not loaded yet, null = no token.
let cachedToken;

const readToken = async () => {
  if (cachedToken === undefined) {
    cachedToken = await AsyncStorage.getItem('auth_token');
  }
  return cachedToken;
};

// Request interceptor to add token (and log requests in development only)
apiClient.interceptors.request.use(
  async (config) => {
    const [token, deviceSignature] = await Promise.all([readToken(), getDeviceSignature()]);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['X-Device-Signature'] = deviceSignature;

    if (__DEV__) {
      console.log(`\n${LOG_SEPARATOR}`);
      console.log(`🚀 API REQUEST [${config.method?.toUpperCase()}] -> ${config.baseURL || ''}${config.url || ''}`);
      if (config.params) {
        console.log('Params:\n' + formatLogJson(config.params));
      }
      console.log(`${LOG_SEPARATOR}\n`);
    }

    return config;
  },
  (error) => {
    if (__DEV__) {
      console.error('❌ Request Error:', error?.message);
    }
    return Promise.reject(error);
  }
);

let onUnauthorizedCallback = null;

export const setUnauthorizedCallback = (callback) => {
  onUnauthorizedCallback = callback;
};

// Response interceptor for error handling and logging
apiClient.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(`✅ API RESPONSE [${response.status}] <- ${response.config?.url}`);
    }

    // Check if body indicates 401 unauthenticated
    if (
      response.data &&
      (response.data.status === 401 ||
        response.data.message === 'Unauthenticated.' ||
        response.data.data?.message === 'Unauthenticated.')
    ) {
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback(response.data);
      }
    }

    return response.data;
  },
  (error) => {
    // Log error response
    if (error.response) {
      const is401 =
        error.response.status === 401 ||
        error.response.data?.status === 401 ||
        error.response.data?.message === 'Unauthenticated.' ||
        error.response.data?.data?.message === 'Unauthenticated.';

      if (is401 && onUnauthorizedCallback) {
        onUnauthorizedCallback(error.response.data);
      }

      if (__DEV__) {
        console.error(`❌ API ERROR RESPONSE [${error.response.status}] <- ${error.config?.url}`);
        console.error('Message:', error.response.data?.message || 'An error occurred');
      }

      // Server responded with error
      const fieldErrors = error.response.data?.errors;
      const firstFieldError = fieldErrors && typeof fieldErrors === 'object'
        ? [].concat(Object.values(fieldErrors)[0] || [])[0]
        : null;

      throw {
        status: error.response.status,
        message: firstFieldError || error.response.data?.message || 'An error occurred',
        data: error.response.data,
      };
    } else if (error.request) {
      if (__DEV__) {
        console.error(`❌ NETWORK ERROR <- ${error.config?.url}`);
      }

      // Request made but no response
      throw {
        status: 0,
        message: 'Network error. Please check your connection.',
        data: null,
      };
    } else {
      if (__DEV__) {
        console.error('❌ REQUEST SETUP ERROR:', error.message);
      }

      // Something else happened
      throw {
        status: 0,
        message: error.message || 'An error occurred',
        data: null,
      };
    }
  }
);

// Token management
export const setToken = async (token) => {
  cachedToken = token || null;
  if (token) {
    await AsyncStorage.setItem('auth_token', token);
  } else {
    await AsyncStorage.removeItem('auth_token');
  }
};

export const getToken = async () => {
  return await readToken();
};

// Auth endpoints
export const register = async (userData) => {
  return apiClient.post('/register', { device_info: getDeviceInfo(), ...userData });
};

export const login = async (credentials) => {
  return apiClient.post('/login', { device_info: getDeviceInfo(), ...credentials });
};

// Security settings and the list of devices linked to the account
export const getSecuritySettings = async () => {
  return apiClient.get('/security-settings');
};

// Password reset: the backend emails a 6-digit code, then accepts it with the new password
export const forgotPassword = async (email) => {
  return apiClient.post('/forgot-password', { email });
};

export const resetPassword = async ({ email, code, password, passwordConfirmation }) => {
  return apiClient.post('/reset-password', {
    email,
    code,
    password,
    password_confirmation: passwordConfirmation,
  });
};

// Generic HTTP methods
export const get = async (endpoint, params = {}) => {
  return apiClient.get(endpoint, { params });
};

export const post = async (endpoint, data = {}) => {
  return apiClient.post(endpoint, data);
};

export const put = async (endpoint, data = {}) => {
  return apiClient.put(endpoint, data);
};

export const del = async (endpoint) => {
  return apiClient.delete(endpoint);
};

export const postFormData = async (endpoint, formData) => {
  return apiClient.post(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Theme endpoint
export const getTheme = async () => {
  return apiClient.get('/theme');
};

// Banner endpoint
export const getBanners = async () => {
  return apiClient.get('/banner');
};

// Notification endpoints
export const savePushToken = async (userId, token) => {
  return apiClient.post('https://ulamadata.ng/app/save-push-token', {
    user_id: userId,
    push_token: token,
  });
};

// Default export for backward compatibility
export default {
  setToken,
  getToken,
  register,
  login,
  forgotPassword,
  resetPassword,
  getSecuritySettings,
  get,
  post,
  put,
  delete: del,
  postFormData,
  getTheme,
  getBanners,
  savePushToken,
  setUnauthorizedCallback,
};
