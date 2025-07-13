export interface Student {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  studentId: string;
  enrollmentDate: string;
  graduationDate?: string;
  program: string;
  status: 'ACTIVE' | 'GRADUATED' | 'WITHDRAWN';
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
  type: string;
  url: string;
  uploadedAt: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
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
  email: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
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
