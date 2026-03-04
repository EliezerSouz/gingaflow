-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Turma" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "activityTypeId" TEXT,
    "teacherId" TEXT,
    "schedule" TEXT,
    "defaultMonthlyFeeCents" INTEGER,
    "defaultPaymentMethod" TEXT,
    "status" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Turma_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Turma_activityTypeId_fkey" FOREIGN KEY ("activityTypeId") REFERENCES "ActivityType" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Turma_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Student" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Turma" ("activityTypeId", "created_at", "defaultMonthlyFeeCents", "defaultPaymentMethod", "id", "name", "schedule", "status", "unitId", "updated_at") SELECT "activityTypeId", "created_at", "defaultMonthlyFeeCents", "defaultPaymentMethod", "id", "name", "schedule", "status", "unitId", "updated_at" FROM "Turma";
DROP TABLE "Turma";
ALTER TABLE "new_Turma" RENAME TO "Turma";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
