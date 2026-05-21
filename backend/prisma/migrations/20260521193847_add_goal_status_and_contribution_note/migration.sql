-- AlterTable
ALTER TABLE "GoalContribution" ADD COLUMN "note" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SavingsGoal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "targetAmount" REAL NOT NULL,
    "savedAmount" REAL NOT NULL DEFAULT 0,
    "deadline" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "SavingsGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SavingsGoal" ("createdAt", "deadline", "id", "name", "savedAmount", "targetAmount", "updatedAt", "userId") SELECT "createdAt", "deadline", "id", "name", "savedAmount", "targetAmount", "updatedAt", "userId" FROM "SavingsGoal";
DROP TABLE "SavingsGoal";
ALTER TABLE "new_SavingsGoal" RENAME TO "SavingsGoal";
CREATE INDEX "SavingsGoal_userId_idx" ON "SavingsGoal"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
