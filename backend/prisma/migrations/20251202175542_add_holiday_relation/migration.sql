-- CreateEnum
CREATE TYPE "HolidayType" AS ENUM ('HOLIDAY', 'EXAM_EVENT', 'OTHER');

-- CreateTable
CREATE TABLE "Holiday" (
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

-- CreateIndex
CREATE INDEX "Holiday_schoolId_date_idx" ON "Holiday"("schoolId", "date");

-- AddForeignKey
ALTER TABLE "Holiday" ADD CONSTRAINT "Holiday_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
