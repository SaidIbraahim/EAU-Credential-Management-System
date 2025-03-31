
import { Student } from '@/types';

export const MOCK_STUDENTS: Student[] = [
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
