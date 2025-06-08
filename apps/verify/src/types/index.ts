export interface Student {
  id: number;
  registrationId: string;
  certificateId?: string;
  fullName: string;
  gender: 'MALE' | 'FEMALE';
  phone?: string;
  departmentId: number;
  facultyId: number;
  academicYearId: number;
  gpa?: number;
  grade?: string;
  graduationDate?: string;
  status: 'CLEARED' | 'UN_CLEARED';
  createdAt: string;
  updatedAt: string;
  
  // Related data from joins
  department?: Department;
  faculty?: Faculty;
  academicYear?: AcademicYear;
  documents?: Document[];
}

export interface Faculty {
  id: number;
  name: string;
  code: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
  facultyId: number;
  createdAt: string;
  updatedAt: string;
  faculty?: Faculty;
}

export interface AcademicYear {
  id: number;
  academicYear: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: number;
  registrationId: number;
  documentType: string;
  fileName: string;
  fileSize?: number;
  fileType?: string;
  fileUrl: string;
  uploadDate: string;
  createdAt: string;
  presignedUrl?: string;
}

export interface VerificationRequest {
  query: string; // Can be registration ID or certificate ID
}

export interface VerificationResponse {
  success: boolean;
  student?: Student;
  message?: string;
}

export interface VerificationResult {
  student: Student;
  verificationDate: string;
  isValid: boolean;
}

// UI Component Props
export interface SearchSectionProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  error?: string;
}

export interface ResultSectionProps {
  result: VerificationResult | null;
  onPrint: () => void;
}

export interface PrintSectionProps {
  result: VerificationResult;
} 