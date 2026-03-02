-- Use new enum value and replace UserRole enum (run in separate transaction after SUB_ADMIN is committed)

-- Migrate roles: old admin roles -> SUB_ADMIN, STUDENT -> PARENT
UPDATE "User" SET "role" = 'SUB_ADMIN' WHERE "role"::text IN ('ACADEMIC_ADMIN', 'FINANCE_ADMIN', 'HR_ADMIN', 'TRANSPORT_MANAGER');
UPDATE "User" SET "role" = 'PARENT' WHERE "role"::text = 'STUDENT';

-- Replace enum with only new values
CREATE TYPE "UserRole_new" AS ENUM ('SUPER_ADMIN', 'SCHOOL_ADMIN', 'SUB_ADMIN', 'TEACHER', 'PARENT');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
