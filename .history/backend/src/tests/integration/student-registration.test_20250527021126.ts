import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../../services/auth.service';
import { StudentService } from '../../services/student.service';
import { DocumentService } from '../../services/document.service';
import { createReadStream } from 'fs';
import path from 'path';

const prisma = new PrismaClient();

describe('Student Registration Flow', () => {
  let adminToken: string;
  let studentId: number;

  const testStudent = {
    full_name: "John Doe",
    registration_no: "GRW-BCS-2024",
    certificate_id: "2024",
    gender: "male",
    phone_number: "+1234567890",
    faculty_id: 1,
    department_id: 1,
    academic_year_id: 1,
    gpa: 3.75,
    grade: "A",
    graduation_date: new Date("2024-05-30"),
    status: "un-cleared"
  };

  beforeAll(async () => {
    // Login as admin
    const adminCredentials = {
      username: 'admin',
      password: 'admin123'
    };

    const authResult = await AuthService.login(
      adminCredentials.username,
      adminCredentials.password
    );
    adminToken = authResult.token;

    // Clean up any existing test data
    await prisma.student.deleteMany({
      where: {
        OR: [
          { registration_no: testStudent.registration_no },
          { certificate_id: testStudent.certificate_id }
        ]
      }
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.student.deleteMany({
      where: {
        OR: [
          { registration_no: testStudent.registration_no },
          { certificate_id: testStudent.certificate_id }
        ]
      }
    });
    await prisma.$disconnect();
  });

  it('should register a new student with personal and academic details', async () => {
    const result = await StudentService.create(testStudent);
    studentId = result.id;

    expect(result).toBeDefined();
    expect(result.full_name).toBe(testStudent.full_name);
    expect(result.registration_no).toBe(testStudent.registration_no);
    expect(result.certificate_id).toBe(testStudent.certificate_id);
    expect(result.status).toBe('un-cleared');
  });

  it('should upload student documents', async () => {
    const documentTypes = ['photo', 'transcript', 'certificate', 'supporting'] as const;
    
    for (const type of documentTypes) {
      const mockFile = {
        fieldname: type,
        originalname: `test-${type}.pdf`,
        encoding: '7bit',
        mimetype: 'application/pdf',
        buffer: Buffer.from('test file content'),
        size: 1024
      };

      const result = await DocumentService.upload(
        studentId,
        mockFile,
        type
      );

      expect(result).toBeDefined();
      expect(result.document_type).toBe(type);
      expect(result.student_id).toBe(studentId);
    }
  });

  it('should retrieve student with uploaded documents', async () => {
    const student = await StudentService.findById(studentId);
    const documents = await DocumentService.findByStudentId(studentId);

    expect(student).toBeDefined();
    expect(student?.full_name).toBe(testStudent.full_name);
    expect(documents).toHaveLength(4);
    expect(documents.map(d => d.document_type)).toEqual(
      expect.arrayContaining(['photo', 'transcript', 'certificate', 'supporting'])
    );
  });

  it('should validate duplicate registration number', async () => {
    await expect(
      StudentService.create({
        ...testStudent,
        certificate_id: '2025' // Different certificate ID
      })
    ).rejects.toThrow('Registration number already exists');
  });

  it('should validate duplicate certificate ID', async () => {
    await expect(
      StudentService.create({
        ...testStudent,
        registration_no: 'GRW-BCS-2025' // Different registration number
      })
    ).rejects.toThrow('Certificate ID already exists');
  });
}); 