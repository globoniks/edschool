-- Tag-based roles: add Tag, UserTag; migrate UserRole to SUB_ADMIN and remove old roles

-- CreateEnum TagType
CREATE TYPE "TagType" AS ENUM ('SUB_ADMIN', 'TEACHER');

-- CreateTable Tag
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TagType" NOT NULL,
    "permissions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");
CREATE INDEX "Tag_type_idx" ON "Tag"("type");

-- CreateTable UserTag
CREATE TABLE "UserTag" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "UserTag_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserTag_userId_tagId_key" ON "UserTag"("userId", "tagId");
CREATE INDEX "UserTag_userId_idx" ON "UserTag"("userId");
CREATE INDEX "UserTag_tagId_idx" ON "UserTag"("tagId");

-- AddForeignKey
ALTER TABLE "UserTag" ADD CONSTRAINT "UserTag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserTag" ADD CONSTRAINT "UserTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Insert predefined tags (ids are deterministic for migration)
INSERT INTO "Tag" ("id", "slug", "name", "type", "permissions") VALUES
  ('tag_academic', 'ACADEMIC', 'Academic', 'SUB_ADMIN', '["manageAcademic"]'),
  ('tag_finance', 'FINANCE', 'Finance', 'SUB_ADMIN', '["manageFinance"]'),
  ('tag_hr', 'HR', 'HR', 'SUB_ADMIN', '["manageHR"]'),
  ('tag_transport', 'TRANSPORT', 'Transport', 'SUB_ADMIN', '["manageTransport"]'),
  ('tag_hod', 'HOD', 'HOD', 'TEACHER', '["hodViewSubmissions","hodEnterExamMarks"]');

-- Link existing role users to tags before changing enum
INSERT INTO "UserTag" ("id", "userId", "tagId")
SELECT gen_random_uuid()::text, u.id, 'tag_academic' FROM "User" u WHERE u.role = 'ACADEMIC_ADMIN';
INSERT INTO "UserTag" ("id", "userId", "tagId")
SELECT gen_random_uuid()::text, u.id, 'tag_finance' FROM "User" u WHERE u.role = 'FINANCE_ADMIN';
INSERT INTO "UserTag" ("id", "userId", "tagId")
SELECT gen_random_uuid()::text, u.id, 'tag_hr' FROM "User" u WHERE u.role = 'HR_ADMIN';
INSERT INTO "UserTag" ("id", "userId", "tagId")
SELECT gen_random_uuid()::text, u.id, 'tag_transport' FROM "User" u WHERE u.role = 'TRANSPORT_MANAGER';

-- Add SUB_ADMIN to enum (must commit before using it - see next migration for UPDATE and enum swap)
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SUB_ADMIN';
