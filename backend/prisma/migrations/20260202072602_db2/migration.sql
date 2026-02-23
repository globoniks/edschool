/*
  Warnings:

  - The values [ADMIN] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACADEMIC_ADMIN', 'FINANCE_ADMIN', 'HR_ADMIN', 'HOD', 'TEACHER', 'PARENT', 'STUDENT');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
COMMIT;

-- CreateTable
CREATE TABLE "HOD" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HOD_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HOD_userId_key" ON "HOD"("userId");

-- CreateIndex
CREATE INDEX "HOD_schoolId_idx" ON "HOD"("schoolId");

-- CreateIndex
CREATE INDEX "HOD_subjectId_idx" ON "HOD"("subjectId");

-- CreateIndex
CREATE INDEX "HOD_userId_idx" ON "HOD"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "HOD_schoolId_subjectId_key" ON "HOD"("schoolId", "subjectId");

-- AddForeignKey
ALTER TABLE "HOD" ADD CONSTRAINT "HOD_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HOD" ADD CONSTRAINT "HOD_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HOD" ADD CONSTRAINT "HOD_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
