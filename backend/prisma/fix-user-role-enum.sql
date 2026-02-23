-- One-time fix: update UserRole enum to include all roles (run if seed fails with "invalid input value for enum UserRole: SUPER_ADMIN").
-- Run from backend dir. psql does NOT accept ?schema=public in the URL, so use one of:
--   psql -h localhost -p 5432 -U edschool_user -d edschool_db -f prisma/fix-user-role-enum.sql
--   psql "postgresql://edschool_user:PASSWORD@localhost:5432/edschool_db" -f prisma/fix-user-role-enum.sql
-- (Do not include ?schema=public in the URL.)

BEGIN;
CREATE TYPE "UserRole_new" AS ENUM (
  'SUPER_ADMIN',
  'SCHOOL_ADMIN',
  'ACADEMIC_ADMIN',
  'FINANCE_ADMIN',
  'HR_ADMIN',
  'TRANSPORT_MANAGER',
  'TEACHER',
  'PARENT',
  'STUDENT'
);
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING (
  CASE "role"::text
    WHEN 'ADMIN' THEN 'SCHOOL_ADMIN'::"UserRole_new"
    ELSE "role"::text::"UserRole_new"
  END
);
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
COMMIT;
