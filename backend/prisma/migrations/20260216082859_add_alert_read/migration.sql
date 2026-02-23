-- CreateTable
CREATE TABLE "AlertRead" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertRead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AlertRead_userId_idx" ON "AlertRead"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AlertRead_userId_alertId_key" ON "AlertRead"("userId", "alertId");

-- AddForeignKey
ALTER TABLE "AlertRead" ADD CONSTRAINT "AlertRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
