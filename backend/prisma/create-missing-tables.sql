-- Create tables that are missing after baselining (when migrate was marked applied but not run).
-- Run with: psql "postgresql://edschool_user:PASSWORD@localhost:5432/edschool_db" -f prisma/create-missing-tables.sql
-- Uses IF NOT EXISTS / DO blocks so safe to run even if some objects exist.

-- HolidayType enum + Holiday table (migration 20251202175542)
DO $$ BEGIN
  CREATE TYPE "HolidayType" AS ENUM ('HOLIDAY', 'EXAM_EVENT', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Holiday" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "date" TIMESTAMP(3) NOT NULL,
  "type" "HolidayType" NOT NULL DEFAULT 'HOLIDAY',
  "isFullDay" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Holiday_schoolId_date_idx" ON "Holiday"("schoolId", "date");
DO $$ BEGIN
  ALTER TABLE "Holiday" ADD CONSTRAINT "Holiday_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ClassMoment (migration 20260123120000)
CREATE TABLE IF NOT EXISTS "ClassMoment" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "caption" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClassMoment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ClassMoment_schoolId_idx" ON "ClassMoment"("schoolId");
CREATE INDEX IF NOT EXISTS "ClassMoment_classId_idx" ON "ClassMoment"("classId");
CREATE INDEX IF NOT EXISTS "ClassMoment_teacherId_idx" ON "ClassMoment"("teacherId");
CREATE INDEX IF NOT EXISTS "ClassMoment_createdAt_idx" ON "ClassMoment"("createdAt");
DO $$ BEGIN
  ALTER TABLE "ClassMoment" ADD CONSTRAINT "ClassMoment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "ClassMoment" ADD CONSTRAINT "ClassMoment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "ClassMoment" ADD CONSTRAINT "ClassMoment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AlertRead (migration 20260216082859)
CREATE TABLE IF NOT EXISTS "AlertRead" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "alertId" TEXT NOT NULL,
  "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AlertRead_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AlertRead_userId_idx" ON "AlertRead"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "AlertRead_userId_alertId_key" ON "AlertRead"("userId", "alertId");
DO $$ BEGIN
  ALTER TABLE "AlertRead" ADD CONSTRAINT "AlertRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Transport: TransportMode enum, Bus, Route, StudentTransport (migration 20260220130000)
DO $$ BEGIN
  CREATE TYPE "TransportMode" AS ENUM ('BUS', 'PARENT_PICKUP');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Bus" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "busNumber" TEXT NOT NULL,
  "driverName" TEXT NOT NULL,
  "driverPhone" TEXT,
  "capacity" INTEGER,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Bus_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Bus_schoolId_busNumber_key" ON "Bus"("schoolId", "busNumber");
CREATE INDEX IF NOT EXISTS "Bus_schoolId_idx" ON "Bus"("schoolId");
DO $$ BEGIN
  ALTER TABLE "Bus" ADD CONSTRAINT "Bus_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Route" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "busId" TEXT,
  "routeNumber" TEXT NOT NULL,
  "pickupPoint" TEXT NOT NULL,
  "dropPoint" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Route_schoolId_idx" ON "Route"("schoolId");
CREATE INDEX IF NOT EXISTS "Route_busId_idx" ON "Route"("busId");
DO $$ BEGIN
  ALTER TABLE "Route" ADD CONSTRAINT "Route_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "Route" ADD CONSTRAINT "Route_busId_fkey" FOREIGN KEY ("busId") REFERENCES "Bus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "StudentTransport" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "transportMode" "TransportMode" NOT NULL,
  "routeId" TEXT,
  "pickupPoint" TEXT,
  "dropPoint" TEXT,
  "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "effectiveTo" TIMESTAMP(3),
  CONSTRAINT "StudentTransport_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "StudentTransport_studentId_key" ON "StudentTransport"("studentId");
CREATE INDEX IF NOT EXISTS "StudentTransport_studentId_idx" ON "StudentTransport"("studentId");
CREATE INDEX IF NOT EXISTS "StudentTransport_routeId_idx" ON "StudentTransport"("routeId");
DO $$ BEGIN
  ALTER TABLE "StudentTransport" ADD CONSTRAINT "StudentTransport_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "StudentTransport" ADD CONSTRAINT "StudentTransport_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
