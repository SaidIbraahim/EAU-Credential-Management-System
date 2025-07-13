export interface Student {
  id: number;
  registrationId: string;
  certificateId?: string;
  fullName: string;
  gender?: 'MALE' | 'FEMALE';
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
  department?: {
    id: number;
    name: string;
    code: string;
  };
  faculty?: {
    id: number;
    name: string;
    code: string;
  };
  academicYear?: {
    id: number;
    academicYear: string;
  };
  documents?: Document[];
}

export interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
  facultyId: number;
  createdAt: string;
  updatedAt: string;
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
  documentType: 'PHOTO' | 'TRANSCRIPT' | 'CERTIFICATE' | 'SUPPORTING';
  fileName: string;
  fileSize?: number;
  fileType?: string;
  fileUrl: string;
  uploadDate: string;
  createdAt: string;
}

export interface AuditLog {
  id: number;
  userId: number;
  action: string;
  resourceType?: string;
  resourceId?: number;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  isActive: boolean;
  mustChangePassword: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Faculty {
  id: number;
  name: string;
  code: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
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
