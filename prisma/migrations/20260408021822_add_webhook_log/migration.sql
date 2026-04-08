-- CreateTable
CREATE TABLE "StravaWebhookLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StravaWebhookLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StravaWebhookLog_userId_idempotencyKey_key" ON "StravaWebhookLog"("userId", "idempotencyKey");

-- AddForeignKey
ALTER TABLE "StravaWebhookLog" ADD CONSTRAINT "StravaWebhookLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
