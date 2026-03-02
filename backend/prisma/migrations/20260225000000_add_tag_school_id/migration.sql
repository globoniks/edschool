-- AlterTable
ALTER TABLE "Tag" ADD COLUMN "schoolId" TEXT;

-- CreateIndex
CREATE INDEX "Tag_schoolId_idx" ON "Tag"("schoolId");

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
