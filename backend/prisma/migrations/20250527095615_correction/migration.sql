/*
  Warnings:

  - You are about to drop the column `fileName` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `mimeType` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `originalName` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `fullName` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `gender` on the `students` table. All the data in the column will be lost.
  - The `status` column on the `students` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `type` on the `documents` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `url` on table `documents` required. This step will fail if there are existing NULL values in that column.
  - Made the column `enrollment_date` on table `students` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "academic_years" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "documents" DROP COLUMN "fileName",
DROP COLUMN "mimeType",
DROP COLUMN "originalName",
DROP COLUMN "size",
DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL,
ALTER COLUMN "url" SET NOT NULL,
ALTER COLUMN "url" DROP DEFAULT;

-- AlterTable
ALTER TABLE "students" DROP COLUMN "fullName",
DROP COLUMN "gender",
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE',
ALTER COLUMN "enrollment_date" SET NOT NULL,
ALTER COLUMN "enrollment_date" DROP DEFAULT,
ALTER COLUMN "program" DROP DEFAULT;
