/*
  Warnings:

  - You are about to drop the column `documentType` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `fileSize` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `fileType` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `fileUrl` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `uploadDate` on the `documents` table. All the data in the column will be lost.
  - Added the required column `mimeType` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalName` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `size` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `documents` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "documents" DROP COLUMN "documentType",
DROP COLUMN "fileSize",
DROP COLUMN "fileType",
DROP COLUMN "fileUrl",
DROP COLUMN "uploadDate",
ADD COLUMN     "mimeType" TEXT NOT NULL,
ADD COLUMN     "originalName" TEXT NOT NULL,
ADD COLUMN     "size" INTEGER NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "type" "DocumentType" NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "documents_studentId_idx" ON "documents"("studentId");
