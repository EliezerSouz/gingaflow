-- AlterTable
ALTER TABLE "Turma" ADD COLUMN "defaultMonthlyFeeCents" INTEGER;
ALTER TABLE "Turma" ADD COLUMN "defaultPaymentMethod" TEXT;

-- AlterTable
ALTER TABLE "Unit" ADD COLUMN "defaultMonthlyFeeCents" INTEGER;
ALTER TABLE "Unit" ADD COLUMN "defaultPaymentMethod" TEXT;
