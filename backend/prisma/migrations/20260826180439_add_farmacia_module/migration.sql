-- CreateEnum
CREATE TYPE "TipoMovimientoKardex" AS ENUM ('ENTRADA', 'SALIDA', 'AJUSTE');

-- AlterEnum
ALTER TYPE "RolUsuario" ADD VALUE 'FARMACIA';

-- AlterTable
ALTER TABLE "ticket_items" ADD COLUMN     "cantidadInsumo" DECIMAL(10,3),
ADD COLUMN     "productoId" INTEGER;

-- CreateTable
CREATE TABLE "productos" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "detalle" TEXT,
    "categoria" TEXT NOT NULL,
    "stockActual" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "unidadMedida" TEXT NOT NULL DEFAULT 'UND',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_kardex" (
    "id" SERIAL NOT NULL,
    "productoId" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" "TipoMovimientoKardex" NOT NULL,
    "cantidad" DECIMAL(10,3) NOT NULL,
    "saldoResultante" DECIMAL(10,3) NOT NULL,
    "motivo" TEXT,
    "ticketId" INTEGER,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_kardex_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "productos_nombre_idx" ON "productos"("nombre");

-- CreateIndex
CREATE INDEX "productos_categoria_idx" ON "productos"("categoria");

-- CreateIndex
CREATE INDEX "movimientos_kardex_productoId_idx" ON "movimientos_kardex"("productoId");

-- CreateIndex
CREATE INDEX "movimientos_kardex_fecha_idx" ON "movimientos_kardex"("fecha");

-- AddForeignKey
ALTER TABLE "movimientos_kardex" ADD CONSTRAINT "movimientos_kardex_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_items" ADD CONSTRAINT "ticket_items_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
