
import { AuditLog } from '@/types';

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: 1,
    user_id: 1,
    action: "Student Added",
    details: "Added student 'Ali Adam' with ID 'EAUGRW0002763'",
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
    details: "Updated information for student 'Sundus Ahmed' with ID 'EAUGRW0001245'",
    timestamp: new Date(2023, 5, 8, 11, 45)
  },
  {
    id: 4,
    user_id: 3,
    action: "Document Uploaded",
    details: "Uploaded transcript for student with ID 'EAUGRW0005142'",
    timestamp: new Date(2023, 5, 7, 16, 20)
  },
  {
    id: 5,
    user_id: 2,
    action: "Student Deleted",
    details: "Removed student 'Ahmed Jama Ali' with ID 'EAUGRW001245'",
    timestamp: new Date(2023, 5, 6, 10, 5)
  }
];
