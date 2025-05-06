
export interface Student {
  id: number;
  student_id: string;
  certificate_id?: string;
  full_name: string;
  gender: 'male' | 'female';
  phone_number?: string;
  department: string;
  faculty?: string;
  academic_year: string;
  gpa: number;
  grade: string;
  admission_date: Date;
  graduation_date?: Date;
  status: 'cleared' | 'un-cleared';
  created_at: Date;
  updated_at: Date;
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
  student_id: number;
  document_type: 'photo' | 'transcript' | 'certificate' | 'supporting';
  file_name: string;
  file_size: number;
  file_type?: string;
  file_url: string;
  upload_date: Date;
  description?: string; // Adding the missing description property
}

export interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  details?: string;
  timestamp: Date;
}

export interface User {
  id: number;
  username: string;
  role: 'admin' | 'super_admin';
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
