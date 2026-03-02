-- CreateTable
CREATE TABLE "Driver" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "userId" TEXT,
    "employeeId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "photo" TEXT,
    "address" TEXT,
    "bloodGroup" TEXT,
    "licenseNumber" TEXT NOT NULL,
    "licenseType" TEXT NOT NULL DEFAULT 'HMV',
    "licenseExpiry" TIMESTAMP(3) NOT NULL,
    "experience" INTEGER DEFAULT 0,
    "previousEmployer" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "emergencyContactRelation" TEXT,
    "salary" DOUBLE PRECISION,
    "joiningDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Driver_userId_key" ON "Driver"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_employeeId_key" ON "Driver"("employeeId");

-- CreateIndex
CREATE INDEX "Driver_schoolId_idx" ON "Driver"("schoolId");

-- CreateIndex
CREATE INDEX "Driver_employeeId_idx" ON "Driver"("employeeId");

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
