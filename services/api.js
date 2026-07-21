import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

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

// Request interceptor to add token and log requests
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request with separator and formatted JSON
    console.log(`\n${LOG_SEPARATOR}`);
    console.log(`🚀 API REQUEST [${config.method?.toUpperCase()}] -> ${config.baseURL || ''}${config.url || ''}`);
    console.log('Headers:\n' + formatLogJson(config.headers));
    if (config.params) {
      console.log('Params:\n' + formatLogJson(config.params));
    }
    if (config.data) {
      console.log('Body:\n' + formatLogJson(config.data));
    }
    console.log(`${LOG_SEPARATOR}\n`);

    return config;
  },
  (error) => {
    console.error(`\n${LOG_SEPARATOR}`);
    console.error('❌ Request Error:\n' + formatLogJson(error));
    console.error(`${LOG_SEPARATOR}\n`);
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
    // Log successful response with separator and formatted JSON
    console.log(`\n${LOG_SEPARATOR}`);
    console.log(`✅ API RESPONSE [${response.status}] <- ${response.config?.url}`);
    console.log('Data:\n' + formatLogJson(response.data));
    console.log(`${LOG_SEPARATOR}\n`);

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

      console.error(`\n${LOG_SEPARATOR}`);
      console.error(`❌ API ERROR RESPONSE [${error.response.status}] <- ${error.config?.url}`);
      console.error('Message:', error.response.data?.message || 'An error occurred');
      console.error('Data:\n' + formatLogJson(error.response.data));
      console.error(`${LOG_SEPARATOR}\n`);

      // Server responded with error
      throw {
        status: error.response.status,
        message: error.response.data?.message || 'An error occurred',
        data: error.response.data,
      };
    } else if (error.request) {
      console.error(`\n${LOG_SEPARATOR}`);
      console.error(`❌ NETWORK ERROR <- ${error.config?.url}`);
      console.error('Message: No response received. Please check your connection.');
      console.error(`${LOG_SEPARATOR}\n`);

      // Request made but no response
      throw {
        status: 0,
        message: 'Network error. Please check your connection.',
        data: null,
      };
    } else {
      console.error(`\n${LOG_SEPARATOR}`);
      console.error('❌ REQUEST SETUP ERROR:', error.message);
      console.error(`${LOG_SEPARATOR}\n`);

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
  if (token) {
    await AsyncStorage.setItem('auth_token', token);
  } else {
    await AsyncStorage.removeItem('auth_token');
  }
};

export const getToken = async () => {
  return await AsyncStorage.getItem('auth_token');
};

// Auth endpoints
export const register = async (userData) => {
  return apiClient.post('/register', userData);
};

export const login = async (credentials) => {
  return apiClient.post('/login', credentials);
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
