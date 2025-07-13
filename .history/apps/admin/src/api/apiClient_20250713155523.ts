import { Student, Document, AuditLog, User, Faculty, Department, AcademicYear } from '@/types';
import { toast } from "sonner";
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// 🔍 DEBUG: Log the API URL being used
console.log('🔍 API_URL being used:', API_URL);
console.log('🔍 VITE_API_URL from env:', import.meta.env.VITE_API_URL);
console.log('🔍 All env vars:', import.meta.env);

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
    // Don't show automatic toasts for 404 errors or specific scenarios
    // Let components handle their own error display for these cases
    const shouldShowAutoToast = !(
      error.response?.status === 404 || // Don't auto-toast 404s
      error.config?.headers?.['X-Skip-Error-Toast'] || // Allow components to skip auto-toast
      error.config?.url?.includes('/auth/login') // Don't auto-toast login errors - let login page handle them
    );
    
    if (shouldShowAutoToast) {
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
      toast.error(errorMessage);
    }
    
    // Handle authentication and authorization errors
    if (error.response?.status === 401) {
      // Don't auto-redirect if this is a login attempt
      if (!error.config?.url?.includes('/auth/login')) {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }
    } else if (error.response?.status === 403) {
      // Account deactivated or insufficient permissions
      const errorMessage = error.response?.data?.message;
      if (errorMessage && errorMessage.includes('deactivated')) {
        // Don't auto-redirect if this is a login attempt - let login page handle it
        if (!error.config?.url?.includes('/auth/login')) {
          toast.error(errorMessage);
          localStorage.removeItem('auth_token');
          // Add a small delay to allow the user to read the message
          setTimeout(() => {
            window.location.href = '/login';
          }, 3000);
        }
      } else {
        toast.error(errorMessage || 'Access denied');
      }
    }
    return Promise.reject(error);
  }
);

// Dashboard Statistics Types
export interface DashboardStats {
  overview: {
    totalStudents: number;
    totalDepartments: number;
    totalFaculties: number;
    maleStudents: number;
    femaleStudents: number;
    malePercentage: number;
    femalePercentage: number;
  };
  graduates: {
    lastYearGraduates: number;
    certificatesIssued: number;
    certificatePercentage: number;
    perfectGPAStudents: number;
  };
  performance: {
    bestDepartment: {
      name: string;
      avgGPA: number;
    };
    perfectGPACount: number;
  };
  departments: Array<{
    id: number;
    name: string;
    studentCount: number;
    averageGPA: number;
  }>;
  trends: {
    monthlyRegistrations: Array<{
      month: string;
      count: number;
    }>;
    gradeDistribution: Array<{
      grade: string;
      count: number;
    }>;
  };
  lastUpdated: string;
}

export interface QuickStats {
  totalStudents: number;
  totalDepartments: number;
  maleStudents: number;
  femaleStudents: number;
  malePercentage: number;
  femalePercentage: number;
  lastYearGraduates: number;
  certificatesIssued: number;
  certificatePercentage: number;
  perfectGPAStudents: number;
}

// Reports Data Types
export interface ReportsData {
  summary: {
    totalStudents: number;
    totalDepartments: number;
    totalFaculties: number;
    averageGPA: number;
    certificateRate: number;
  };
  departmentAnalysis: {
    distribution: Array<{
      id: number;
      name: string;
      faculty: string;
      totalStudents: number;
      maleStudents: number;
      femaleStudents: number;
      certificatesIssued: number;
      averageGPA: number;
      certificateRate: number;
    }>;
    topPerforming: Array<{
      id: number;
      name: string;
      faculty: string;
      totalStudents: number;
      maleStudents: number;
      femaleStudents: number;
      certificatesIssued: number;
      averageGPA: number;
      certificateRate: number;
    }>;
  };
  academicPerformance: {
    gpaDistribution: Array<{
      range: string;
      count: number;
      percentage: number;
    }>;
    gradeDistribution: Array<{
      grade: string;
      count: number;
      percentage: number;
    }>;
    topPerformers: Array<{
      name: string;
      registrationId: string;
      gpa: number;
      department: string;
      faculty: string;
    }>;
  };
  trends: {
    yearlyAdmissions: Array<{
      year: string;
      count: number;
    }>;
    graduationTrends: Array<{
      year: string;
      count: number;
    }>;
    monthlyRegistrations: Array<{
      month: string;
      count: number;
    }>;
  };
  demographics: {
    genderDistribution: Array<{
      gender: string;
      count: number;
      percentage: number;
    }>;
  };
  certificates: {
    totalIssued: number;
    totalPending: number;
    issuanceRate: number;
    byDepartment: Array<{
      department: string;
      issued: number;
      total: number;
      rate: number;
    }>;
  };
  lastUpdated: string;
}

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/dashboard/stats');
    return response.data.data;
  },

  getQuickStats: async (): Promise<QuickStats> => {
    const response = await api.get('/dashboard/quick-stats');
    return response.data.data;
  },

  getReports: async (): Promise<ReportsData> => {
    const response = await api.get('/dashboard/reports');
    return response.data;
  }
};

export const studentsApi = {
  getAll: async (page = 1, limit = 10): Promise<{ data: Student[]; total: number; totalPages: number }> => {
    const response = await api.get('/students', { 
      params: { page, limit }
    });
    return response.data;
  },

  // New method: Get all students for validation (no pagination)
  getAllForValidation: async (): Promise<{ data: Student[]; total: number }> => {
    const response = await api.get('/students/validation');
    console.log(`📊 Fetched ${response.data.total} students for validation`);
    return response.data;
  },
  
  getById: async (id: string): Promise<Student> => {
    const response = await api.get(`/students/${id}`);
    return response.data.data; // Fix: Extract data from nested structure
  },
  
  create: async (data: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>): Promise<Student> => {
    const response = await api.post('/students', {
      registrationId: data.registrationId,
      certificateId: data.certificateId,
      fullName: data.fullName,
      gender: data.gender,
      phone: data.phone,
      departmentId: data.departmentId,
      facultyId: data.facultyId,
      academicYearId: data.academicYearId,
      gpa: data.gpa,
      grade: data.grade,
      graduationDate: data.graduationDate,
      status: data.status
    });
    return response.data;
  },
  
  update: async (id: string, data: Partial<Student>): Promise<Student> => {
    const response = await api.put(`/students/${id}`, data);
    return response.data.data; // Fix: Extract data from nested structure to match backend response
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/students/${id}`);
  },
  
  bulkCreate: async (students: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<{ 
    success: boolean; 
    count: number; 
    students: Student[] 
  }> => {
    const response = await api.post('/students/bulk', { students });
    return response.data;
  },

  // Add the bulkImport function that the frontend is calling
  bulkImport: async (students: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<{ 
    success: boolean; 
    count: number; 
    students: Student[] 
  }> => {
    // Students are already in the correct format from parseCSV
    const response = await api.post('/students/bulk', { students });
    return response.data;
  }
};

export const documentsApi = {
  upload: async (registrationId: string, documentType: string, formData: FormData): Promise<Document> => {
    const response = await api.post(`/documents/student/${registrationId}/${documentType}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  getByStudentId: async (registrationId: string): Promise<Document[]> => {
    const response = await api.get(`/documents/student/${registrationId}`);
    return response.data;
  },

  getAll: async (page = 1, limit = 10): Promise<{ documents: Document[]; total: number }> => {
    const response = await api.get('/documents', { 
      params: { page, limit }
    });
    return response.data;
  },

  getById: async (documentId: string): Promise<Document> => {
    const response = await api.get(`/documents/${documentId}`);
    return response.data;
  },

  update: async (documentId: string, data: Partial<Document>): Promise<Document> => {
    const response = await api.put(`/documents/${documentId}`, data);
    return response.data;
  },

  download: async (documentId: string): Promise<string> => {
    const response = await api.get(`/documents/${documentId}/download`);
    return response.data.url;
  },

  delete: async (documentId: string): Promise<void> => {
    await api.delete(`/documents/${documentId}`);
  },

  bulkUpload: async (formData: FormData): Promise<{
    success: boolean;
    summary: {
      totalProcessed: number;
      totalSuccessful: number;
      totalErrors: number;
      studentsProcessed: number;
    };
    results: Array<{
      registrationId: string;
      documentType: string;
      fileName: string;
      documentId: number;
      status: string;
    }>;
    errors?: string[];
  }> => {
    const response = await api.post('/documents/bulk', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};

export const auditLogApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    action?: string;
    resourceType?: string;
    userId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<{ 
    auditLogs: AuditLog[]; 
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> => {
    const response = await api.get('/audit-logs', { params });
    return response.data.data;
  },

  getById: async (id: number): Promise<AuditLog> => {
    const response = await api.get(`/audit-logs/${id}`);
    return response.data.data;
  },
  
  logAction: async (action: string, resourceType?: string, resourceId?: number, details?: string): Promise<AuditLog> => {
    const response = await api.post('/audit-logs', { 
      action, 
      resourceType, 
      resourceId, 
      details 
    });
    return response.data.data;
  },

  getStats: async (): Promise<{
    totals: {
      total: number;
      today: number;
      thisWeek: number;
      thisMonth: number;
    };
    topActions: Array<{
      action: string;
      count: number;
    }>;
    topUsers: Array<{
      user: {
        id: number;
        email: string;
        role: string;
      };
      count: number;
    }>;
    recentActivities: AuditLog[];
  }> => {
    const response = await api.get('/audit-logs/stats');
    return response.data.data;
  },

  exportCsv: async (params?: {
    startDate?: string;
    endDate?: string;
    action?: string;
    resourceType?: string;
  }): Promise<Blob> => {
    const response = await api.get('/audit-logs/export', { 
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  cleanup: async (daysToKeep: number = 90): Promise<{
    deletedCount: number;
    cutoffDate: string;
  }> => {
    const response = await api.delete('/audit-logs/cleanup', {
      data: { daysToKeep }
    });
    return response.data.data;
  }
};

export const authApi = {
  login: async (email: string, password: string): Promise<{ user: User, token: string }> => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data.data;
    localStorage.setItem('auth_token', token);
    return { user, token };
  },

  logout: async (): Promise<void> => {
    try {
      // Make API call first while token is still available
      await api.post('/auth/logout');
    } catch (error) {
      // Log error but don't throw - we still want to clear local storage
      console.warn('Logout API call failed, but clearing local storage:', error);
    } finally {
      // Always clear token from localStorage regardless of API call success
      localStorage.removeItem('auth_token');
    }
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/profile');
    return response.data.data;
  },

  updateProfile: async (profileData: { email?: string }): Promise<User> => {
    const response = await api.put('/auth/profile', profileData);
    return response.data.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  forgotPassword: async (email: string): Promise<{ success: boolean, message: string }> => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  verifyResetCode: async (email: string, code: string): Promise<{ success: boolean, message: string }> => {
    const response = await api.post('/auth/verify-reset-code', { email, code });
    return response.data;
  },

  resetPassword: async (email: string, code: string, newPassword: string): Promise<{ success: boolean, message: string }> => {
    const response = await api.post('/auth/reset-password', { email, code, newPassword });
    return response.data;
  }
};

// User Management API (Admin/Super Admin functions)
export const usersApi = {
  getAll: async (page = 1, limit = 10): Promise<{ users: User[]; total: number; totalPages: number }> => {
    const response = await api.get('/users', { 
      params: { page, limit }
    });
    return response.data.data;
  },

  getById: async (id: number): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data.data;
  },

  create: async (userData: { email: string; password: string; role: 'ADMIN' | 'SUPER_ADMIN' }): Promise<User> => {
    const response = await api.post('/users', userData);
    return response.data.data;
  },

  update: async (id: number, userData: Partial<User>): Promise<User> => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  revokeAdminPrivileges: async (id: number): Promise<User> => {
    const response = await api.put(`/users/${id}`, { 
      isActive: false 
    });
    return response.data.data;
  },

  restoreAdminPrivileges: async (id: number): Promise<User> => {
    const response = await api.put(`/users/${id}`, { 
      isActive: true 
    });
    return response.data.data;
  }
};

export const facultiesApi = {
  getAll: async (): Promise<Faculty[]> => {
    const response = await api.get('/academic/faculties'); // OPTIMIZED ROUTE
    return response.data.data; // Note: optimized route returns { data: [...] }
  },

  create: async (data: Omit<Faculty, 'id' | 'createdAt' | 'updatedAt'>): Promise<Faculty> => {
    const response = await api.post('/faculties', data); // Keep original for mutations
    return response.data;
  },

  update: async (id: number, data: Omit<Faculty, 'id' | 'createdAt' | 'updatedAt'>): Promise<Faculty> => {
    const response = await api.put(`/faculties/${id}`, data); // Keep original for mutations
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/faculties/${id}`); // Keep original for mutations
  }
};

export const departmentsApi = {
  getAll: async (): Promise<Department[]> => {
    const response = await api.get('/academic/departments'); // OPTIMIZED ROUTE
    return response.data.data; // Note: optimized route returns { data: [...] }
  },
  
  getByFacultyId: async (facultyId: number): Promise<Department[]> => {
    const response = await api.get(`/departments/faculty/${facultyId}`); // Keep specialized route
    return response.data;
  },

  create: async (data: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>): Promise<Department> => {
    const response = await api.post('/departments', data); // Keep original for mutations
    return response.data;
  },

  update: async (id: number, data: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>): Promise<Department> => {
    const response = await api.put(`/departments/${id}`, data); // Keep original for mutations
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/departments/${id}`); // Keep original for mutations
  }
};

export const academicYearsApi = {
  getAll: async (): Promise<AcademicYear[]> => {
    const response = await api.get('/academic/years'); // OPTIMIZED ROUTE
    return response.data.data; // Note: optimized route returns { data: [...] }
  },

  create: async (data: Omit<AcademicYear, 'id' | 'createdAt' | 'updatedAt'>): Promise<AcademicYear> => {
    const response = await api.post('/academic-years', data); // Keep original for mutations
    return response.data;
  },

  update: async (id: number, data: Omit<AcademicYear, 'id' | 'createdAt' | 'updatedAt'>): Promise<AcademicYear> => {
    const response = await api.put(`/academic-years/${id}`, data); // Keep original for mutations
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/academic-years/${id}`); // Keep original for mutations
  }
};

// Function to cleanup object URLs used for document previews
export const cleanupObjectUrls = () => {
  const objectUrls = JSON.parse(localStorage.getItem('object_urls') || '[]');
  objectUrls.forEach((url: string) => URL.revokeObjectURL(url));
  localStorage.removeItem('object_urls');
};
