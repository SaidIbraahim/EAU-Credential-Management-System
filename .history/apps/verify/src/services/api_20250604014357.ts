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
   * Verify a student by registration ID or certificate ID using the public endpoint
   */
  static async verifyStudent(query: string): Promise<VerificationResponse> {
    try {
      if (!query.trim()) {
        return {
          success: false,
          message: 'Please enter a Certificate Number or Registration Number',
        };
      }

      // Use the new public verification endpoint - this already includes documents with presigned URLs
      const response = await api.get(`/verify/${encodeURIComponent(query.trim())}`);
      
      if (response.data.success && response.data.student) {
        return {
          success: true,
          student: response.data.student,
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'No student found with the provided ID',
        };
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      
      if (error.response?.status === 404) {
        return {
          success: false,
          message: 'No student found with the provided ID',
        };
      } else if (error.response?.status === 400) {
        return {
          success: false,
          message: error.response.data.message || 'Invalid identifier format',
        };
      } else {
        return {
          success: false,
          message: 'An error occurred while verifying the certificate. Please try again.',
        };
      }
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