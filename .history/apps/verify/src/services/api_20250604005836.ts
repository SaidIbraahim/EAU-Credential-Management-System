import axios from 'axios';
import { Student, VerificationRequest, VerificationResponse } from '../types';

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API service class
export class VerificationApi {
  /**
   * Verify a student by registration ID or certificate ID
   */
  static async verifyStudent(query: string): Promise<VerificationResponse> {
    try {
      // First, try to find by registration ID
      if (query.startsWith('GRW-')) {
        const student = await this.getStudentByRegistrationId(query);
        if (student) {
          return {
            success: true,
            student,
          };
        }
      }
      
      // If not found by registration ID or query is numeric, try by certificate ID
      if (/^\d+$/.test(query)) {
        const student = await this.getStudentByCertificateId(query);
        if (student) {
          return {
            success: true,
            student,
          };
        }
      }
      
      // If still not found, return error
      return {
        success: false,
        message: 'No student found with the provided ID',
      };
    } catch (error) {
      console.error('Verification error:', error);
      return {
        success: false,
        message: 'An error occurred while verifying the certificate',
      };
    }
  }

  /**
   * Get student by registration ID with all related data
   */
  private static async getStudentByRegistrationId(registrationId: string): Promise<Student | null> {
    try {
      // Search through all students to find by registration ID
      const response = await api.get('/students', {
        params: { 
          page: 1, 
          limit: 1000, // Get enough records to search through
        }
      });
      
      const student = response.data.data.find((s: Student) => 
        s.registrationId === registrationId
      );
      
      if (student) {
        // Get additional related data
        return await this.enrichStudentData(student);
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching student by registration ID:', error);
      return null;
    }
  }

  /**
   * Get student by certificate ID with all related data
   */
  private static async getStudentByCertificateId(certificateId: string): Promise<Student | null> {
    try {
      // Search through all students to find by certificate ID
      const response = await api.get('/students', {
        params: { 
          page: 1, 
          limit: 1000, // Get enough records to search through
        }
      });
      
      const student = response.data.data.find((s: Student) => 
        s.certificateId === certificateId
      );
      
      if (student) {
        // Get additional related data
        return await this.enrichStudentData(student);
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching student by certificate ID:', error);
      return null;
    }
  }

  /**
   * Enrich student data with related information (faculty, department, etc.)
   */
  private static async enrichStudentData(student: Student): Promise<Student> {
    try {
      // Fetch related data in parallel
      const [facultiesResponse, departmentsResponse, academicYearsResponse] = await Promise.all([
        api.get('/faculties'),
        api.get('/departments'),
        api.get('/academic-years')
      ]);

      const faculties = facultiesResponse.data;
      const departments = departmentsResponse.data;
      const academicYears = academicYearsResponse.data;

      // Find related entities
      const faculty = faculties.find((f: any) => f.id === student.facultyId);
      const department = departments.find((d: any) => d.id === student.departmentId);
      const academicYear = academicYears.find((ay: any) => ay.id === student.academicYearId);

      // Try to get student documents (photos)
      let documents = [];
      try {
        const documentsResponse = await api.get(`/documents/student/${student.registrationId}`);
        documents = documentsResponse.data;
      } catch (error) {
        console.warn('Could not fetch student documents:', error);
      }

      return {
        ...student,
        faculty,
        department,
        academicYear,
        documents,
      };
    } catch (error) {
      console.error('Error enriching student data:', error);
      // Return student data even if enrichment fails
      return student;
    }
  }

  /**
   * Health check for the API
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await api.get('/faculties');
      return response.status === 200;
    } catch (error) {
      console.error('API health check failed:', error);
      return false;
    }
  }
}

export default VerificationApi; 