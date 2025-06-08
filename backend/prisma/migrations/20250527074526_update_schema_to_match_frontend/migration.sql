/*
  Warnings:

  - You are about to drop the column `academicYear` on the `academic_years` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `academic_years` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `academic_years` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `academic_years` table. All the data in the column will be lost.
  - You are about to drop the column `ipAddress` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `resourceId` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `resourceType` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `departments` table. All the data in the column will be lost.
  - You are about to drop the column `facultyId` on the `departments` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `departments` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `fileName` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `mimeType` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `originalName` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `studentId` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `faculties` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `faculties` table. All the data in the column will be lost.
  - You are about to drop the column `academicYearId` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `certificateId` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `departmentId` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `facultyId` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `fullName` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `gender` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `graduationDate` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `registrationId` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `students` table. All the data in the column will be lost.
  - The `status` column on the `students` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[academic_year]` on the table `academic_years` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[registration_id]` on the table `students` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[certificate_id]` on the table `students` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[student_id]` on the table `students` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `academic_year` to the `academic_years` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `academic_years` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `audit_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `faculty_id` to the `departments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `departments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `student_id` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `url` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `documents` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updated_at` to the `faculties` table without a default value. This is not possible if the table is not empty.
  - Added the required column `academic_year_id` to the `students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `department_id` to the `students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `enrollment_date` to the `students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `faculty_id` to the `students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `first_name` to the `students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_name` to the `students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `program` to the `students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `registration_id` to the `students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `student_id` to the `students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `students` table without a default value. This is not possible if the table is not empty.

*/
-- Step 1: Create temporary columns for data preservation
ALTER TABLE "academic_years" ADD "temp_academic_year" TEXT;
ALTER TABLE "academic_years" ADD "temp_is_active" BOOLEAN;
UPDATE "academic_years" SET 
  "temp_academic_year" = "academicYear",
  "temp_is_active" = "isActive";

ALTER TABLE "students" ADD "temp_first_name" TEXT;
ALTER TABLE "students" ADD "temp_last_name" TEXT;
UPDATE "students" SET 
  "temp_first_name" = LEFT("fullName", POSITION(' ' IN "fullName") - 1),
  "temp_last_name" = SUBSTRING("fullName" FROM POSITION(' ' IN "fullName") + 1);

-- Step 2: Drop existing foreign key constraints
ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_userId_fkey";
ALTER TABLE "departments" DROP CONSTRAINT IF EXISTS "departments_facultyId_fkey";
ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "documents_studentId_fkey";
ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "students_academicYearId_fkey";
ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "students_departmentId_fkey";
ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "students_facultyId_fkey";

-- Step 3: Drop old columns and add new ones
-- Academic Years
ALTER TABLE "academic_years" DROP COLUMN IF EXISTS "academicYear";
ALTER TABLE "academic_years" DROP COLUMN IF EXISTS "createdAt";
ALTER TABLE "academic_years" DROP COLUMN IF EXISTS "isActive";
ALTER TABLE "academic_years" DROP COLUMN IF EXISTS "updatedAt";
ALTER TABLE "academic_years" ADD "academic_year" TEXT;
ALTER TABLE "academic_years" ADD "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "academic_years" ADD "is_active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "academic_years" ADD "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "academic_years" SET 
  "academic_year" = "temp_academic_year",
  "is_active" = COALESCE("temp_is_active", true);

-- Audit Logs
ALTER TABLE "audit_logs" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "audit_logs" RENAME COLUMN "resourceType" TO "resource_type";
ALTER TABLE "audit_logs" RENAME COLUMN "resourceId" TO "resource_id";
ALTER TABLE "audit_logs" RENAME COLUMN "ipAddress" TO "ip_address";
ALTER TABLE "audit_logs" RENAME COLUMN "userAgent" TO "user_agent";

-- Departments
ALTER TABLE "departments" RENAME COLUMN "facultyId" TO "faculty_id";
ALTER TABLE "departments" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "departments" RENAME COLUMN "updatedAt" TO "updated_at";

-- Documents
ALTER TABLE "documents" RENAME COLUMN "studentId" TO "student_id";
ALTER TABLE "documents" ADD "url" TEXT DEFAULT '';
ALTER TABLE "documents" ADD "status" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "documents" ADD "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "documents" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "documents" RENAME COLUMN "updatedAt" TO "updated_at";

UPDATE "documents" SET "url" = CONCAT('https://storage.example.com/', "fileName") WHERE "url" = '';

-- Faculties
ALTER TABLE "faculties" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "faculties" RENAME COLUMN "updatedAt" TO "updated_at";

-- Students
ALTER TABLE "students" RENAME COLUMN "registrationId" TO "registration_id";
ALTER TABLE "students" RENAME COLUMN "certificateId" TO "certificate_id";
ALTER TABLE "students" RENAME COLUMN "academicYearId" TO "academic_year_id";
ALTER TABLE "students" RENAME COLUMN "departmentId" TO "department_id";
ALTER TABLE "students" RENAME COLUMN "facultyId" TO "faculty_id";
ALTER TABLE "students" RENAME COLUMN "graduationDate" TO "graduation_date";
ALTER TABLE "students" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "students" RENAME COLUMN "updatedAt" TO "updated_at";
ALTER TABLE "students" ADD "first_name" TEXT;
ALTER TABLE "students" ADD "last_name" TEXT;
ALTER TABLE "students" ADD "student_id" TEXT;
ALTER TABLE "students" ADD "enrollment_date" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "students" ADD "program" TEXT DEFAULT 'Unknown';

UPDATE "students" SET 
  "first_name" = "temp_first_name",
  "last_name" = "temp_last_name",
  "student_id" = COALESCE("registration_id", CONCAT('STU', CAST(id AS TEXT)));

-- Step 4: Clean up temporary columns
ALTER TABLE "academic_years" DROP COLUMN IF EXISTS "temp_academic_year";
ALTER TABLE "academic_years" DROP COLUMN IF EXISTS "temp_is_active";
ALTER TABLE "students" DROP COLUMN IF EXISTS "temp_first_name";
ALTER TABLE "students" DROP COLUMN IF EXISTS "temp_last_name";

-- Step 5: Add back constraints
ALTER TABLE "academic_years" ALTER COLUMN "academic_year" SET NOT NULL;
ALTER TABLE "students" ALTER COLUMN "first_name" SET NOT NULL;
ALTER TABLE "students" ALTER COLUMN "last_name" SET NOT NULL;
ALTER TABLE "students" ALTER COLUMN "student_id" SET NOT NULL;
ALTER TABLE "students" ALTER COLUMN "program" SET NOT NULL;

-- Step 6: Create indexes
CREATE UNIQUE INDEX "academic_years_academic_year_key" ON "academic_years"("academic_year");
CREATE INDEX "documents_student_id_idx" ON "documents"("student_id");
CREATE UNIQUE INDEX "students_registration_id_key" ON "students"("registration_id");
CREATE UNIQUE INDEX "students_certificate_id_key" ON "students"("certificate_id");
CREATE UNIQUE INDEX "students_student_id_key" ON "students"("student_id");

-- Step 7: Add back foreign key constraints
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "departments" ADD CONSTRAINT "departments_faculty_id_fkey" 
  FOREIGN KEY ("faculty_id") REFERENCES "faculties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "documents" ADD CONSTRAINT "documents_student_id_fkey" 
  FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "students" ADD CONSTRAINT "students_academic_year_id_fkey" 
  FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "students" ADD CONSTRAINT "students_department_id_fkey" 
  FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "students" ADD CONSTRAINT "students_faculty_id_fkey" 
  FOREIGN KEY ("faculty_id") REFERENCES "faculties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
