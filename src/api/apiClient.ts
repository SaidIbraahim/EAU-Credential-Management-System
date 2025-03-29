
import { Student, Document, AuditLog, User } from '@/types';
import { toast } from "sonner";

const API_BASE_URL = '/api';

// Store object URLs to properly clean them up
const objectUrlStore: string[] = [];

// Function to revoke all object URLs to prevent memory leaks
export const revokeAllObjectUrls = () => {
  objectUrlStore.forEach(url => {
    try {
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error revoking object URL:", error);
    }
  });
  objectUrlStore.length = 0; // Clear the array
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
      return { 
        data: MOCK_STUDENTS,
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
  upload: async (studentId: string, files: File[], documentType: 'photo' | 'transcript' | 'certificate' | 'supporting' = 'supporting'): Promise<Document[]> => {
    try {
      console.log(`Uploading ${files.length} files for student ${studentId} as ${documentType}`);
      
      // Create Document objects for the uploaded files
      const documents = files.map((file, index) => {
        // Create object URL for the file and store it for later cleanup
        const objectUrl = URL.createObjectURL(file);
        objectUrlStore.push(objectUrl);
        
        return {
          id: Math.floor(Math.random() * 1000) + index,
          student_id: parseInt(studentId),
          document_type: documentType,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          file_url: objectUrl,
          upload_date: new Date()
        };
      });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return documents;
    } catch (error) {
      console.error(`Error uploading documents for student ${studentId}:`, error);
      throw error;
    }
  },
  
  getByStudentId: async (studentId: string): Promise<Document[]> => {
    try {
      // In a real implementation, we would fetch documents from the server
      return [];
    } catch (error) {
      console.error(`Error fetching documents for student ${studentId}:`, error);
      throw error;
    }
  },
  
  deleteDocument: async (documentId: string): Promise<void> => {
    try {
      console.log(`Deleting document ${documentId}`);
      // In a real implementation, we would delete the document from the server
    } catch (error) {
      console.error(`Error deleting document ${documentId}:`, error);
      throw error;
    }
  }
};

export const reportsApi = {
  generate: async (filters = {}): Promise<any> => {
    try {
      return {
        departmentDistribution: [
          { department: 'Computer Science', count: 45 },
          { department: 'Medicine', count: 32 },
          { department: 'Engineering', count: 28 },
          { department: 'Business', count: 25 },
          { department: 'Law', count: 18 }
        ],
        gpaDistribution: [
          { range: '3.5-4.0', count: 35 },
          { range: '3.0-3.5', count: 42 },
          { range: '2.5-3.0', count: 38 },
          { range: '2.0-2.5', count: 25 },
          { range: 'Below 2.0', count: 12 }
        ],
        yearlyAdmissions: [
          { year: '2018', count: 120 },
          { year: '2019', count: 135 },
          { year: '2020', count: 115 },
          { year: '2021', count: 140 },
          { year: '2022', count: 150 }
        ]
      };
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
          user: {
            id: 1,
            username: 'admin',
            role: 'admin',
            created_at: new Date(),
            updated_at: new Date()
          },
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
      return [
        {
          id: 1,
          username: 'admin',
          role: 'admin',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          username: 'super_admin',
          role: 'super_admin',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
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

const MOCK_STUDENTS: Student[] = [
  {
    id: 1,
    student_id: "EAUGRW0001234",
    certificate_id: "9685124",
    full_name: "Ali Adam Jama",
    gender: "male",
    phone_number: "+252908123456",
    department: "Computer Science",
    academic_year: "2020-2021",
    gpa: 3.5,
    grade: "A",
    admission_date: new Date("2021-09-01"),
    graduation_date: new Date("2025-06-30"),
    status: "cleared",
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 2,
    student_id: "EAUGRW0001265",
    certificate_id: "cert20251354",
    full_name: "Hawa Yusuf Ali",
    gender: "female",
    phone_number: "+252908987654",
    department: "Medicine",
    academic_year: "2019-2020",
    gpa: 3.4,
    grade: "B",
    admission_date: new Date("2020-09-01"),
    graduation_date: new Date("2024-06-30"),
    status: "un-cleared",
    created_at: new Date(),
    updated_at: new Date(),
  }
];

const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: 1,
    user_id: 1,
    action: "Student Added",
    details: "Added student 'John Doe' with ID 'ST2023001'",
    timestamp: new Date(2023, 5, 10, 9, 30)
  },
  {
    id: 2,
    user_id: 2,
    action: "Bulk Import",
    details: "Imported 25 students from CSV file",
    timestamp: new Date(2023, 5, 9, 14, 15)
  },
  {
    id: 3,
    user_id: 1,
    action: "Student Updated",
    details: "Updated information for student 'Jane Smith' with ID 'ST2023005'",
    timestamp: new Date(2023, 5, 8, 11, 45)
  },
  {
    id: 4,
    user_id: 3,
    action: "Document Uploaded",
    details: "Uploaded transcript for student with ID 'ST2023010'",
    timestamp: new Date(2023, 5, 7, 16, 20)
  },
  {
    id: 5,
    user_id: 2,
    action: "Student Deleted",
    details: "Removed student 'Alex Johnson' with ID 'ST2023015'",
    timestamp: new Date(2023, 5, 6, 10, 5)
  }
];
