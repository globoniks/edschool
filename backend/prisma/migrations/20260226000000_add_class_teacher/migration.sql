-- AlterTable
ALTER TABLE "Class" ADD COLUMN "classTeacherId" TEXT;
ALTER TABLE "Class" ADD COLUMN "responsibilities" JSONB;

-- CreateIndex
CREATE INDEX "Class_classTeacherId_idx" ON "Class"("classTeacherId");

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_classTeacherId_fkey" FOREIGN KEY ("classTeacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
