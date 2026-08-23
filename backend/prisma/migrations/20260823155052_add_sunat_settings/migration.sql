-- AlterTable
ALTER TABLE "ajustes" ADD COLUMN     "sunatAutoEmitir" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sunatClave" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "sunatRuc" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "sunatUsuario" TEXT NOT NULL DEFAULT '';
