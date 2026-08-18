-- CreateTable
CREATE TABLE "ajustes" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
    "whatsappNumeroNegocio" TEXT NOT NULL DEFAULT '',
    "whatsappGerentes" TEXT NOT NULL DEFAULT '',
    "whatsappProvider" TEXT NOT NULL DEFAULT 'dummy',
    "whatsappToken" TEXT NOT NULL DEFAULT '',
    "whatsappApiUrl" TEXT NOT NULL DEFAULT '',
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ajustes_pkey" PRIMARY KEY ("id")
);
