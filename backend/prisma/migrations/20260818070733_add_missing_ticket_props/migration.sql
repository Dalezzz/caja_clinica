-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "consultorio" TEXT,
ADD COLUMN     "estadoAtencion" TEXT NOT NULL DEFAULT 'ESPERA';
