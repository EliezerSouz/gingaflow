/*
  Warnings:

  - You are about to drop the column `activityTypeId` on the `Student` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "StudentActivity" (
    "studentId" TEXT NOT NULL,
    "activityTypeId" TEXT NOT NULL,

    PRIMARY KEY ("studentId", "activityTypeId"),
    CONSTRAINT "StudentActivity_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudentActivity_activityTypeId_fkey" FOREIGN KEY ("activityTypeId") REFERENCES "ActivityType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "full_name" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "birth_date" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "enrollment_date" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "currentGraduationId" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_Student" ("birth_date", "cpf", "created_at", "currentGraduationId", "email", "enrollment_date", "full_name", "id", "notes", "phone", "status", "updated_at") SELECT "birth_date", "cpf", "created_at", "currentGraduationId", "email", "enrollment_date", "full_name", "id", "notes", "phone", "status", "updated_at" FROM "Student";
DROP TABLE "Student";
ALTER TABLE "new_Student" RENAME TO "Student";
CREATE UNIQUE INDEX "Student_cpf_key" ON "Student"("cpf");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
