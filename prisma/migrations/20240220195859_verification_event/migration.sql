/*
  Warnings:

  - You are about to drop the `action_verification` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "action_verification";

-- CreateTable
CREATE TABLE "password_reset_events" (
    "id" TEXT NOT NULL,
    "verificationEventId" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "password_reset_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_events" (
    "id" TEXT NOT NULL,
    "accessKey" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_events_verificationEventId_key" ON "password_reset_events"("verificationEventId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_events_accessKey_key" ON "verification_events"("accessKey");

-- AddForeignKey
ALTER TABLE "password_reset_events" ADD CONSTRAINT "password_reset_events_verificationEventId_fkey" FOREIGN KEY ("verificationEventId") REFERENCES "verification_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
