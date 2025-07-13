import axios from 'axios';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
    toast.error(errorMessage);
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Document API
export const documentApi = {
  upload: async (file: File, studentId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('studentId', studentId);
    
    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
  },

  getByStudentId: async (studentId: string) => {
    const response = await api.get(`/documents/student/${studentId}`);
    return response.data;
  },
};

// Student API
export const studentApi = {
  create: async (data: any) => {
    const response = await api.post('/students', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/students/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/students/${id}`);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/students/${id}`);
    return response.data;
  },

  getAll: async (params?: any) => {
    const response = await api.get('/students', { params });
    return response.data;
  },
};

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data.data;
    localStorage.setItem('auth_token', token);
    return { user, token };
  },

  logout: async () => {
    localStorage.removeItem('auth_token');
    await api.post('/auth/logout');
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
}; 