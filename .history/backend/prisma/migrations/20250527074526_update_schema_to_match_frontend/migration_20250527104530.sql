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
-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_userId_fkey";

-- DropForeignKey
ALTER TABLE "departments" DROP CONSTRAINT "departments_facultyId_fkey";

-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_studentId_fkey";

-- DropForeignKey
ALTER TABLE "students" DROP CONSTRAINT "students_academicYearId_fkey";

-- DropForeignKey
ALTER TABLE "students" DROP CONSTRAINT "students_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "students" DROP CONSTRAINT "students_facultyId_fkey";

-- DropIndex
DROP INDEX "academic_years_academicYear_key";

-- DropIndex
DROP INDEX "documents_studentId_idx";

-- DropIndex
DROP INDEX "students_certificateId_key";

-- DropIndex
DROP INDEX "students_registrationId_key";

-- AlterTable
ALTER TABLE "academic_years" DROP COLUMN "academicYear",
DROP COLUMN "createdAt",
DROP COLUMN "isActive",
DROP COLUMN "updatedAt",
ADD COLUMN     "academic_year" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "audit_logs" DROP COLUMN "ipAddress",
DROP COLUMN "resourceId",
DROP COLUMN "resourceType",
DROP COLUMN "userAgent",
DROP COLUMN "userId",
ADD COLUMN     "ip_address" TEXT,
ADD COLUMN     "resource_id" INTEGER,
ADD COLUMN     "resource_type" TEXT,
ADD COLUMN     "user_agent" TEXT,
ADD COLUMN     "user_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "departments" DROP COLUMN "createdAt",
DROP COLUMN "facultyId",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "faculty_id" INTEGER NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "documents" DROP COLUMN "createdAt",
DROP COLUMN "fileName",
DROP COLUMN "mimeType",
DROP COLUMN "originalName",
DROP COLUMN "size",
DROP COLUMN "studentId",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "student_id" INTEGER NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "url" TEXT NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "faculties" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "students" DROP COLUMN "academicYearId",
DROP COLUMN "certificateId",
DROP COLUMN "createdAt",
DROP COLUMN "departmentId",
DROP COLUMN "facultyId",
DROP COLUMN "fullName",
DROP COLUMN "gender",
DROP COLUMN "graduationDate",
DROP COLUMN "registrationId",
DROP COLUMN "updatedAt",
ADD COLUMN     "academic_year_id" INTEGER NOT NULL,
ADD COLUMN     "certificate_id" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "department_id" INTEGER NOT NULL,
ADD COLUMN     "enrollment_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "faculty_id" INTEGER NOT NULL,
ADD COLUMN     "first_name" TEXT NOT NULL,
ADD COLUMN     "graduation_date" TIMESTAMP(3),
ADD COLUMN     "last_name" TEXT NOT NULL,
ADD COLUMN     "program" TEXT NOT NULL,
ADD COLUMN     "registration_id" TEXT NOT NULL,
ADD COLUMN     "student_id" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE UNIQUE INDEX "academic_years_academic_year_key" ON "academic_years"("academic_year");

-- CreateIndex
CREATE INDEX "documents_student_id_idx" ON "documents"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_registration_id_key" ON "students"("registration_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_certificate_id_key" ON "students"("certificate_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_student_id_key" ON "students"("student_id");

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "faculties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "faculties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
