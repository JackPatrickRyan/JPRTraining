-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cycleFTP" INTEGER NOT NULL DEFAULT 200,
    "runThresholdPace" INTEGER NOT NULL DEFAULT 270,
    "swimCSS" INTEGER NOT NULL DEFAULT 95,
    "restingHR" INTEGER NOT NULL DEFAULT 45,
    "maxHR" INTEGER NOT NULL DEFAULT 190,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
