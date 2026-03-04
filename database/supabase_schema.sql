-- GingaFlow - ULTIMATE Multi-tenant Supabase Schema
-- Paste this into the Supabase SQL Editor

-- 1. Create Tables
CREATE TABLE "Organization" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "document" TEXT UNIQUE,
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE "User" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "email" TEXT UNIQUE NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "relatedId" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE "Student" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
    "full_name" TEXT NOT NULL,
    "nickname" TEXT,
    "cpf" TEXT NOT NULL,
    "birth_date" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "enrollment_date" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "currentGraduationId" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE UNIQUE INDEX "Student_org_cpf_unique" ON "Student"("organizationId", "cpf");

CREATE TABLE "Teacher" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
    "full_name" TEXT NOT NULL,
    "nickname" TEXT,
    "cpf" TEXT NOT NULL,
    "birth_date" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "graduation" TEXT,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "userId" TEXT UNIQUE REFERENCES "User"("id"),
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE UNIQUE INDEX "Teacher_org_cpf_unique" ON "Teacher"("organizationId", "cpf");

CREATE TABLE "Unit" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "color" TEXT,
    "defaultMonthlyFeeCents" INTEGER,
    "defaultPaymentMethod" TEXT,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE "ActivityType" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "usaGraduacao" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "ActivityType_org_name_unique" ON "ActivityType"("organizationId", "name");

CREATE TABLE "Turma" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "unitId" TEXT NOT NULL REFERENCES "Unit"("id") ON DELETE CASCADE,
    "activityTypeId" TEXT REFERENCES "ActivityType"("id"),
    "teacherId" TEXT REFERENCES "Teacher"("id"),
    "schedule" TEXT,
    "defaultMonthlyFeeCents" INTEGER,
    "defaultPaymentMethod" TEXT,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE "StudentTurma" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
    "studentId" TEXT NOT NULL REFERENCES "Student"("id") ON DELETE CASCADE,
    "turmaId" TEXT NOT NULL REFERENCES "Turma"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "StudentTurma_unique" ON "StudentTurma"("studentId", "turmaId");

CREATE TABLE "TeacherTurma" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
    "teacherId" TEXT NOT NULL REFERENCES "Teacher"("id") ON DELETE CASCADE,
    "turmaId" TEXT NOT NULL REFERENCES "Turma"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "TeacherTurma_unique" ON "TeacherTurma"("teacherId", "turmaId");

CREATE TABLE "StudentActivity" (
    "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
    "studentId" TEXT NOT NULL REFERENCES "Student"("id") ON DELETE CASCADE,
    "activityTypeId" TEXT NOT NULL REFERENCES "ActivityType"("id") ON DELETE CASCADE,
    PRIMARY KEY ("studentId", "activityTypeId")
);

CREATE TABLE "Payment" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
    "studentId" TEXT NOT NULL REFERENCES "Student"("id") ON DELETE CASCADE,
    "monthlyFeeCents" INTEGER NOT NULL,
    "dueDay" INTEGER NOT NULL,
    "period" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "paidAt" TIMESTAMP WITH TIME ZONE,
    "method" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "Payment_unique" ON "Payment"("studentId", "period");

CREATE TABLE "Graduation" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
    "studentId" TEXT NOT NULL REFERENCES "Student"("id") ON DELETE CASCADE,
    "previousGraduationId" TEXT,
    "newGraduationId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "teacherId" TEXT REFERENCES "Teacher"("id"),
    "type" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE "Attendance" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
    "studentId" TEXT NOT NULL REFERENCES "Student"("id") ON DELETE CASCADE,
    "turmaId" TEXT NOT NULL REFERENCES "Turma"("id") ON DELETE CASCADE,
    "date" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "Attendance_unique" ON "Attendance"("studentId", "turmaId", "date");

CREATE TABLE "AppSettings" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "organizationId" TEXT UNIQUE NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
    "groupName" TEXT NOT NULL DEFAULT 'Grupo de Capoeira',
    "logoUrl" TEXT,
    "themeColor" TEXT NOT NULL DEFAULT 'blue',
    "defaultMonthlyFee" INTEGER NOT NULL DEFAULT 0,
    "defaultPaymentMethod" TEXT NOT NULL DEFAULT 'PIX',
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE "GraduationLevel" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
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
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Insert Default Organization
INSERT INTO "Organization" (id, name, document) 
VALUES ('b47b4b1a-0b3b-4b1a-9c1a-1a2b3c4d5e6f', 'GingaFlow Matriz', '00000000001');

-- 3. Insert Default Admin User
INSERT INTO "User" ("organizationId", name, email, password_hash, role) 
VALUES ('b47b4b1a-0b3b-4b1a-9c1a-1a2b3c4d5e6f', 'Mestre Administrador', 'admin@gingaflow.com', '$2b$10$7EqIF5s73Gsl4WNoX.4E4OxO0iUuM.e8zXJ1K/s5.s/qYJvOEXpW2', 'ADMIN');

-- 4. Default Settings
INSERT INTO "AppSettings" ("organizationId", "groupName") 
VALUES ('b47b4b1a-0b3b-4b1a-9c1a-1a2b3c4d5e6f', 'GingaFlow Escola Modelo');
