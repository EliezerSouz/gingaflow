/*
  Warnings:

  - You are about to drop the column `level` on the `Graduation` table. All the data in the column will be lost.
  - You are about to drop the column `teacher` on the `Graduation` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `Graduation` table. All the data in the column will be lost.
  - Added the required column `newGraduationId` to the `Graduation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Student" ADD COLUMN "currentGraduationId" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Graduation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "previousGraduationId" TEXT,
    "newGraduationId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "teacherId" TEXT,
    "type" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Graduation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Graduation_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Student" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Graduation" ("created_at", "date", "id", "notes", "studentId", "type") SELECT "created_at", "date", "id", "notes", "studentId", "type" FROM "Graduation";
DROP TABLE "Graduation";
ALTER TABLE "new_Graduation" RENAME TO "Graduation";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
