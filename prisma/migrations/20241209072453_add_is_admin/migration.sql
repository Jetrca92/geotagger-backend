-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "UserActionLog_createdAt_idx" ON "UserActionLog"("createdAt");

-- CreateIndex
CREATE INDEX "UserActionLog_userId_idx" ON "UserActionLog"("userId");
