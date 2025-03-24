
import { Student, Document, AuditLog, User } from '@/types';
import { toast } from "sonner";

// Base API URL - would come from environment in production
const API_BASE_URL = '/api';

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || `Error: ${response.status} ${response.statusText}`;
    toast.error(errorMessage);
    throw new Error(errorMessage);
  }
  return response.json();
};

// Students API
export const studentsApi = {
  getAll: async (page = 1, limit = 10, filters = {}): Promise<{ data: Student[], total: number }> => {
    // For now, return mock data
    return { 
      data: MOCK_STUDENTS,
      total: MOCK_STUDENTS.length
    };
  },
  
  getById: async (id: string): Promise<Student> => {
    // For now, return mock data
    const student = MOCK_STUDENTS.find(s => s.id.toString() === id);
    if (!student) {
      throw new Error('Student not found');
    }
    return student;
  },
  
  create: async (student: Omit<Student, 'id' | 'created_at' | 'updated_at'>): Promise<Student> => {
    // In a real implementation, this would make a POST request
    // For now, log the data and return a mock response
    console.log('Creating student:', student);
    return {
      ...student,
      id: Math.floor(Math.random() * 1000),
      created_at: new Date(),
      updated_at: new Date()
    };
  },
  
  update: async (id: string, student: Partial<Student>): Promise<Student> => {
    // In a real implementation, this would make a PUT request
    // For now, log the data and return a mock response
    console.log(`Updating student ${id}:`, student);
    return {
      ...MOCK_STUDENTS.find(s => s.id.toString() === id)!,
      ...student,
      updated_at: new Date()
    };
  },
  
  delete: async (id: string): Promise<void> => {
    // In a real implementation, this would make a DELETE request
    // For now, just log the action
    console.log(`Deleting student ${id}`);
  },
  
  bulkImport: async (students: Omit<Student, 'id' | 'created_at' | 'updated_at'>[]): Promise<{ success: boolean, count: number }> => {
    // In a real implementation, this would make a POST request with the students data
    // For now, log the data and return a mock response
    console.log('Bulk importing students:', students);
    return { success: true, count: students.length };
  }
};

// Documents API
export const documentsApi = {
  upload: async (studentId: string, files: File[]): Promise<Document[]> => {
    // In a real implementation, this would upload files to cloud storage
    // For now, log the action and return mock responses
    console.log(`Uploading ${files.length} files for student ${studentId}`);
    return files.map((file, index) => ({
      id: Math.floor(Math.random() * 1000) + index,
      student_id: parseInt(studentId),
      document_type: 'supporting',
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      file_url: URL.createObjectURL(file),
      upload_date: new Date()
    }));
  },
  
  getByStudentId: async (studentId: string): Promise<Document[]> => {
    // For now, return empty array
    return [];
  }
};

// Reports API
export const reportsApi = {
  generate: async (filters = {}): Promise<any> => {
    // For now, return mock data
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
  }
};

// Audit Log API
export const auditLogApi = {
  getAll: async (page = 1, limit = 10): Promise<{ data: AuditLog[], total: number }> => {
    // For now, return mock data from AuditLog.tsx
    return {
      data: MOCK_AUDIT_LOGS,
      total: MOCK_AUDIT_LOGS.length
    };
  },
  
  logAction: async (action: string, details: string): Promise<void> => {
    // In a real implementation, this would make a POST request
    // For now, just log the action
    console.log(`Audit Log: ${action} - ${details}`);
  }
};

// Users API
export const usersApi = {
  login: async (username: string, password: string): Promise<{ user: User, token: string }> => {
    // For now, return mock data
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
  },
  
  getAll: async (): Promise<User[]> => {
    // For now, return mock data
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
  }
};

// Mock data for students
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
    status: "uncleared",
    created_at: new Date(),
    updated_at: new Date(),
  }
];

// Mock data for audit logs
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
