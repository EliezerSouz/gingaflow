-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "relatedId" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupName" TEXT NOT NULL DEFAULT 'Grupo de Capoeira',
    "logoUrl" TEXT,
    "themeColor" TEXT NOT NULL DEFAULT 'blue',
    "defaultMonthlyFee" INTEGER NOT NULL DEFAULT 0,
    "defaultPaymentMethod" TEXT NOT NULL DEFAULT 'PIX',
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GraduationLevel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "grau" INTEGER,
    "cordaType" TEXT,
    "color" TEXT,
    "colorLeft" TEXT,
    "colorRight" TEXT,
    "pontaLeft" TEXT,
    "pontaRight" TEXT,
    "order" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
