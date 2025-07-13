export interface Student {
  id: number;
  registrationId: string;
  certificateId?: string;
  full_name: string;
  email?: string;
  graduationDate?: string;
  program: string;
  departmentId: number;
  facultyId: number;
  academicYearId: number;
  gpa?: number;
  grade?: string;
  status: 'ACTIVE' | 'GRADUATED' | 'WITHDRAWN';
  createdAt: string;
  updatedAt: string;
  department?: {
    id: number;
    name: string;
  };
  faculty?: {
    id: number;
    name: string;
  };
  academicYear?: {
    id: number;
    year: string;
  };
  documents?: Array<{
    id: number;
    title: string;
    type: string;
    url: string;
    status: string;
    uploadedAt: string;
  }>;
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
  studentId: number;
  title: string;
  description?: string;
  type: string;
  url: string;
  uploadedAt: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
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
  email: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
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
