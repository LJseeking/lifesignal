-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "birthDate" TEXT NOT NULL,
    "birthTime" TEXT,
    "birthTimePrecision" TEXT NOT NULL DEFAULT 'unknown',
    "birthShichen" TEXT,
    "birthTimeRange" TEXT,
    "birthPlace" TEXT,
    "gender" TEXT NOT NULL,
    "focus" TEXT NOT NULL,
    "mbti" TEXT,
    "bloodType" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Profile" ("birthDate", "birthPlace", "birthTime", "bloodType", "focus", "gender", "id", "mbti", "updatedAt", "userId") SELECT "birthDate", "birthPlace", "birthTime", "bloodType", "focus", "gender", "id", "mbti", "updatedAt", "userId" FROM "Profile";
DROP TABLE "Profile";
ALTER TABLE "new_Profile" RENAME TO "Profile";
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
