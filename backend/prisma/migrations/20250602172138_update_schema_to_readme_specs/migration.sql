/*
  Warnings:

  - You are about to drop the column `description` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `student_id` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `uploaded_at` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `enrollment_date` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `first_name` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `last_name` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `program` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `student_id` on the `students` table. All the data in the column will be lost.
  - The `status` column on the `students` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `passwordHash` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[username]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `document_type` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `file_name` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `file_url` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `registration_id` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `full_name` to the `students` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_student_id_fkey";

-- DropIndex
DROP INDEX "documents_studentId_idx";

-- DropIndex
DROP INDEX "documents_student_id_idx";

-- DropIndex
DROP INDEX "students_student_id_key";

-- AlterTable
ALTER TABLE "documents" DROP COLUMN "description",
DROP COLUMN "status",
DROP COLUMN "student_id",
DROP COLUMN "title",
DROP COLUMN "type",
DROP COLUMN "updated_at",
DROP COLUMN "uploaded_at",
DROP COLUMN "url",
ADD COLUMN     "document_type" TEXT NOT NULL,
ADD COLUMN     "file_name" TEXT NOT NULL,
ADD COLUMN     "file_size" INTEGER,
ADD COLUMN     "file_type" TEXT,
ADD COLUMN     "file_url" TEXT NOT NULL,
ADD COLUMN     "registration_id" INTEGER NOT NULL,
ADD COLUMN     "upload_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "students" DROP COLUMN "email",
DROP COLUMN "enrollment_date",
DROP COLUMN "first_name",
DROP COLUMN "last_name",
DROP COLUMN "program",
DROP COLUMN "student_id",
ADD COLUMN     "full_name" TEXT NOT NULL,
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "phone" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'UN_CLEARED';

-- AlterTable
ALTER TABLE "users" DROP COLUMN "passwordHash",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "last_login" TIMESTAMP(3),
ADD COLUMN     "must_change_password" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "password_hash" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "username" TEXT;

-- CreateIndex
CREATE INDEX "documents_registration_id_idx" ON "documents"("registration_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
