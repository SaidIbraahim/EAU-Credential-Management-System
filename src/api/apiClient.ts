import { Student, Document, AuditLog, User } from '@/types';
import { toast } from "sonner";
import { MOCK_STUDENTS } from '@/mock/students';
import { MOCK_AUDIT_LOGS } from '@/mock/auditLogs';
import { MOCK_REPORT_DATA } from '@/mock/reportData';
import { MOCK_USERS } from '@/mock/users';
import { FILE_TYPES } from '@/mock/fileTypes';

const API_BASE_URL = '/api';

// Store created object URLs to clean up later
const objectUrls: string[] = [];

// Helper to clean up object URLs to prevent memory leaks
export const cleanupObjectUrls = () => {
  objectUrls.forEach(url => {
    try {
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Error revoking object URL:", e);
    }
  });
  objectUrls.length = 0;
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || `Error: ${response.status} ${response.statusText}`;
    toast.error(errorMessage);
    throw new Error(errorMessage);
  }
  return response.json();
};

const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    return handleResponse(response);
  } catch (error) {
    console.error('API request error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Network error';
    toast.error(`API Error: ${errorMessage}`);
    throw error;
  }
};

export const studentsApi = {
  getAll: async (page = 1, limit = 10, filters = {}): Promise<{ data: Student[], total: number }> => {
    try {
      // Simulate pagination with mock data
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedStudents = MOCK_STUDENTS.slice(startIndex, endIndex);
      
      return { 
        data: paginatedStudents,
        total: MOCK_STUDENTS.length
      };
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  },
  
  getById: async (id: string): Promise<Student> => {
    try {
      const student = MOCK_STUDENTS.find(s => s.id.toString() === id);
      if (!student) {
        throw new Error('Student not found');
      }
      return student;
    } catch (error) {
      console.error(`Error fetching student ${id}:`, error);
      throw error;
    }
  },
  
  create: async (student: Omit<Student, 'id' | 'created_at' | 'updated_at'>): Promise<Student> => {
    try {
      console.log('Creating student:', student);
      return {
        ...student,
        id: Math.floor(Math.random() * 1000),
        created_at: new Date(),
        updated_at: new Date()
      };
    } catch (error) {
      console.error('Error creating student:', error);
      throw error;
    }
  },
  
  update: async (id: string, student: Partial<Student>): Promise<Student> => {
    try {
      console.log(`Updating student ${id}:`, student);
      return {
        ...MOCK_STUDENTS.find(s => s.id.toString() === id)!,
        ...student,
        updated_at: new Date()
      };
    } catch (error) {
      console.error(`Error updating student ${id}:`, error);
      throw error;
    }
  },
  
  delete: async (id: string): Promise<void> => {
    try {
      console.log(`Deleting student ${id}`);
    } catch (error) {
      console.error(`Error deleting student ${id}:`, error);
      throw error;
    }
  },
  
  bulkImport: async (students: Omit<Student, 'id' | 'created_at' | 'updated_at'>[]): Promise<{ success: boolean, count: number }> => {
    try {
      console.log('Bulk importing students:', students);
      return { success: true, count: students.length };
    } catch (error) {
      console.error('Error bulk importing students:', error);
      throw error;
    }
  }
};

export const documentsApi = {
  upload: async (studentId: string, files: File[], documentType: 'photo' | 'transcript' | 'certificate' | 'supporting'): Promise<Document[]> => {
    try {
      const uploadedDocs: Document[] = [];
      
      // Get allowed types for the document type
      const allowedTypes = FILE_TYPES[documentType].extensions;
      
      for (const file of files) {
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        const isValidType = allowedTypes.some(type => type === extension);
        
        if (!isValidType) {
          throw new Error(`Invalid file type for ${documentType}. Allowed types: ${FILE_TYPES[documentType].displayText}`);
        }
        
        const objectUrl = URL.createObjectURL(file);
        objectUrls.push(objectUrl); // Track URLs for cleanup
        
        const newDoc: Document = {
          id: Math.floor(Math.random() * 10000),
          student_id: Number(studentId),
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          file_url: objectUrl,
          document_type: documentType,
          upload_date: new Date(),
          description: ''
        };
        
        uploadedDocs.push(newDoc);
      }
      
      return uploadedDocs;
    } catch (error) {
      console.error("Error uploading documents:", error);
      throw error;
    }
  },
  
  getByStudentId: async (studentId: string): Promise<Document[]> => {
    try {
      // In a real application, this would fetch documents from the server
      // For this example, we'll return a mock array of documents
      if (localStorage.getItem(`student_${studentId}_documents`)) {
        return JSON.parse(localStorage.getItem(`student_${studentId}_documents`) || '[]');
      }
      return [];
    } catch (error) {
      console.error(`Error fetching documents for student ${studentId}:`, error);
      return [];
    }
  },
  
  deleteDocument: async (documentId: string): Promise<void> => {
    try {
      console.log(`Deleting document ${documentId}`);
      // Find and revoke the object URL if it exists
      const docToDelete = objectUrls.find(url => url.includes(documentId));
      if (docToDelete) {
        URL.revokeObjectURL(docToDelete);
        const index = objectUrls.indexOf(docToDelete);
        if (index > -1) {
          objectUrls.splice(index, 1);
        }
      }
    } catch (error) {
      console.error(`Error deleting document ${documentId}:`, error);
      throw error;
    }
  }
};

export const reportsApi = {
  generate: async (filters = {}): Promise<any> => {
    try {
      return MOCK_REPORT_DATA;
    } catch (error) {
      console.error('Error generating reports:', error);
      throw error;
    }
  }
};

export const auditLogApi = {
  getAll: async (page = 1, limit = 10): Promise<{ data: AuditLog[], total: number }> => {
    try {
      return {
        data: MOCK_AUDIT_LOGS,
        total: MOCK_AUDIT_LOGS.length
      };
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  },
  
  logAction: async (action: string, details: string): Promise<void> => {
    try {
      console.log(`Audit Log: ${action} - ${details}`);
    } catch (error) {
      console.error('Error logging action:', error);
      throw error;
    }
  }
};

export const usersApi = {
  login: async (username: string, password: string): Promise<{ user: User, token: string }> => {
    try {
      if (username === 'admin' && password === 'password') {
        return {
          user: MOCK_USERS[0],
          token: 'mock-jwt-token'
        };
      }
      throw new Error('Invalid credentials');
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  },
  
  register: async (userData: { username: string, password: string, role: 'admin' | 'super_admin' }): Promise<User> => {
    try {
      return {
        id: Math.floor(Math.random() * 1000),
        username: userData.username,
        role: userData.role,
        created_at: new Date(),
        updated_at: new Date()
      };
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  },
  
  getAll: async (): Promise<User[]> => {
    try {
      return MOCK_USERS;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },
  
  update: async (id: number, userData: Partial<User>): Promise<User> => {
    try {
      return {
        id,
        username: userData.username || 'admin',
        role: userData.role || 'admin',
        created_at: new Date(),
        updated_at: new Date()
      };
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      throw error;
    }
  }
};
