-- AlterEnum: Add TRANSPORT_MANAGER to UserRole (after HR_ADMIN)
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACADEMIC_ADMIN', 'FINANCE_ADMIN', 'HR_ADMIN', 'TRANSPORT_MANAGER', 'HOD', 'TEACHER', 'PARENT', 'STUDENT');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
COMMIT;

-- CreateTable: Bus
CREATE TABLE "Bus" (
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

-- CreateTable: Route
CREATE TABLE "Route" (
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

-- CreateEnum: TransportMode
CREATE TYPE "TransportMode" AS ENUM ('BUS', 'PARENT_PICKUP');

-- CreateTable: StudentTransport
CREATE TABLE "StudentTransport" (
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

-- CreateIndex
CREATE UNIQUE INDEX "Bus_schoolId_busNumber_key" ON "Bus"("schoolId", "busNumber");
CREATE INDEX "Bus_schoolId_idx" ON "Bus"("schoolId");

CREATE INDEX "Route_schoolId_idx" ON "Route"("schoolId");
CREATE INDEX "Route_busId_idx" ON "Route"("busId");

CREATE UNIQUE INDEX "StudentTransport_studentId_key" ON "StudentTransport"("studentId");
CREATE INDEX "StudentTransport_studentId_idx" ON "StudentTransport"("studentId");
CREATE INDEX "StudentTransport_routeId_idx" ON "StudentTransport"("routeId");

-- AddForeignKey
ALTER TABLE "Bus" ADD CONSTRAINT "Bus_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Route" ADD CONSTRAINT "Route_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Route" ADD CONSTRAINT "Route_busId_fkey" FOREIGN KEY ("busId") REFERENCES "Bus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StudentTransport" ADD CONSTRAINT "StudentTransport_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentTransport" ADD CONSTRAINT "StudentTransport_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE SET NULL ON UPDATE CASCADE;
