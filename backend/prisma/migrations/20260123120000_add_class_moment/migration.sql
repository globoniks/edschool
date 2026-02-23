-- CreateTable
CREATE TABLE "ClassMoment" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassMoment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClassMoment_schoolId_idx" ON "ClassMoment"("schoolId");

-- CreateIndex
CREATE INDEX "ClassMoment_classId_idx" ON "ClassMoment"("classId");

-- CreateIndex
CREATE INDEX "ClassMoment_teacherId_idx" ON "ClassMoment"("teacherId");

-- CreateIndex
CREATE INDEX "ClassMoment_createdAt_idx" ON "ClassMoment"("createdAt");

-- AddForeignKey
ALTER TABLE "ClassMoment" ADD CONSTRAINT "ClassMoment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassMoment" ADD CONSTRAINT "ClassMoment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassMoment" ADD CONSTRAINT "ClassMoment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
