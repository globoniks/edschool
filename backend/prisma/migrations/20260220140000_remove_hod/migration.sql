-- Drop HOD table and remove HOD from UserRole enum.
-- Existing users with role HOD are converted to TEACHER.

-- DropTable
DROP TABLE IF EXISTS "HOD";

-- AlterEnum: Remove HOD from UserRole (map existing HOD users to TEACHER)
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACADEMIC_ADMIN', 'FINANCE_ADMIN', 'HR_ADMIN', 'TRANSPORT_MANAGER', 'TEACHER', 'PARENT', 'STUDENT');
UPDATE "User" SET "role" = 'TEACHER' WHERE "role"::text = 'HOD';
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
COMMIT;
