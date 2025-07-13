export interface Student {
  id: number;
  registrationId: string;
  certificateId?: string;
  fullName: string;
  gender: 'male' | 'female';
  email: string;
  departmentId: number;
  facultyId: number;
  academicYearId: number;
  gpa?: number;
  grade?: string;
  graduationDate?: string;
  status: 'cleared' | 'un-cleared';
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface AcademicYear {
  id: number;
  academic_year: string;
  created_at: Date;
  updated_at: Date;
}

export interface Document {
  id: number;
  studentId: number;
  documentType: 'photo' | 'transcript' | 'certificate' | 'supporting';
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  description?: string;
  uploadDate: string;
  createdAt: string;
}

export interface AuditLog {
  id: number;
  userId: number;
  action: string;
  resourceType: string;
  resourceId: number;
  details: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Faculty {
  id: number;
  name: string;
  code: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  trend?: {
    value: number;
    label?: string;
  };
  icon: React.ReactNode;
  delay?: number;
}
