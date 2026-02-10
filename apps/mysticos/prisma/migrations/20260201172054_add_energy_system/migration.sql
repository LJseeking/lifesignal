-- CreateTable
CREATE TABLE "EnergyAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "energyLevel" INTEGER NOT NULL DEFAULT 50,
    "lastChargedAt" DATETIME,
    "lastDecayDate" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EnergyAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "EnergyAccount_userId_key" ON "EnergyAccount"("userId");
