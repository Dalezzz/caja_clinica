-- AlterTable
ALTER TABLE "ajustes" ADD COLUMN     "whatsappAlCierre" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "whatsappFrecuencia" TEXT NOT NULL DEFAULT 'diario',
ADD COLUMN     "whatsappUltimoEnvio" TIMESTAMP(3);
