import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const BASE_URL = 'https://databeta.com.ng/app';

// Create axios instance
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token and log requests
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request
    console.log('🚀 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.baseURL + config.url,
      params: config.params,
      headers: config.headers,
      data: config.data,
    });

    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and logging
apiClient.interceptors.response.use(
  (response) => {
    // Log successful response
    console.log('✅ API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });

    //API response stringify
    console.log('✅ API Response Stringify:', JSON.stringify(response.data));

    return response.data;
  },
  (error) => {
    // Log error response
    if (error.response) {
      console.error('❌ API Error Response:', {
        status: error.response.status,
        url: error.config?.url,
        message: error.response.data?.message,
        data: error.response.data,
      });

      console.error('❌ API Error Response Stringify:', JSON.stringify(error.response.data));

      // Server responded with error
      throw {
        status: error.response.status,
        message: error.response.data?.message || 'An error occurred',
        data: error.response.data,
      };
    } else if (error.request) {
      console.error('❌ Network Error:', {
        url: error.config?.url,
        message: 'No response received',
      });

      // Request made but no response
      throw {
        status: 0,
        message: 'Network error. Please check your connection.',
        data: null,
      };
    } else {
      console.error('❌ Request Setup Error:', error.message);

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
export const get = async (endpoint, config = {}) => {
  return apiClient.get(endpoint, config);
};

export const post = async (endpoint, data) => {
  return apiClient.post(endpoint, data);
};

export const put = async (endpoint, data) => {
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
};
