-- CreateTable
CREATE TABLE "Curriculum" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Curriculum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurriculumChapter" (
    "id" TEXT NOT NULL,
    "curriculumId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurriculumChapter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Curriculum_classId_subjectId_academicYear_key" ON "Curriculum"("classId", "subjectId", "academicYear");
CREATE INDEX "Curriculum_schoolId_idx" ON "Curriculum"("schoolId");
CREATE INDEX "Curriculum_classId_idx" ON "Curriculum"("classId");
CREATE INDEX "CurriculumChapter_curriculumId_idx" ON "CurriculumChapter"("curriculumId");

-- AddForeignKey
ALTER TABLE "Curriculum" ADD CONSTRAINT "Curriculum_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Curriculum" ADD CONSTRAINT "Curriculum_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Curriculum" ADD CONSTRAINT "Curriculum_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CurriculumChapter" ADD CONSTRAINT "CurriculumChapter_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "Curriculum"("id") ON DELETE CASCADE ON UPDATE CASCADE;
