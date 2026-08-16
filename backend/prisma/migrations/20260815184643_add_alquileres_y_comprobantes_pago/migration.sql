-- CreateEnum
CREATE TYPE "EstadoAlquiler" AS ENUM ('ACTIVO', 'FINALIZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EstadoComprobante" AS ENUM ('BORRADOR', 'FIRMADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "alquileres_espacios" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "fechaInicio" DATE NOT NULL,
    "fechaFin" DATE NOT NULL,
    "precioTotal" DECIMAL(10,2) NOT NULL,
    "estado" "EstadoAlquiler" NOT NULL DEFAULT 'ACTIVO',
    "arrendatario" TEXT NOT NULL,
    "contacto" TEXT,
    "observaciones" TEXT,
    "cajaDiariaId" INTEGER NOT NULL,
    "usuarioCreadorId" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alquileres_espacios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comprobantes_pago_medicos" (
    "id" SERIAL NOT NULL,
    "medicoId" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodoInicio" DATE NOT NULL,
    "periodoFin" DATE NOT NULL,
    "montoTotal" DECIMAL(10,2) NOT NULL,
    "montoDescuento" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "montoNeto" DECIMAL(10,2) NOT NULL,
    "cantidadServicios" INTEGER NOT NULL,
    "estado" "EstadoComprobante" NOT NULL DEFAULT 'BORRADOR',
    "firmaDigital" TEXT,
    "documentoPdfPath" TEXT,
    "observaciones" TEXT,
    "cajaDiariaId" INTEGER,
    "usuarioCreadorId" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comprobantes_pago_medicos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "alquileres_espacios_fechaInicio_fechaFin_idx" ON "alquileres_espacios"("fechaInicio", "fechaFin");

-- CreateIndex
CREATE INDEX "alquileres_espacios_estado_idx" ON "alquileres_espacios"("estado");

-- CreateIndex
CREATE INDEX "comprobantes_pago_medicos_medicoId_fecha_idx" ON "comprobantes_pago_medicos"("medicoId", "fecha");

-- CreateIndex
CREATE INDEX "comprobantes_pago_medicos_estado_idx" ON "comprobantes_pago_medicos"("estado");

-- AddForeignKey
ALTER TABLE "alquileres_espacios" ADD CONSTRAINT "alquileres_espacios_cajaDiariaId_fkey" FOREIGN KEY ("cajaDiariaId") REFERENCES "cajas_diarias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alquileres_espacios" ADD CONSTRAINT "alquileres_espacios_usuarioCreadorId_fkey" FOREIGN KEY ("usuarioCreadorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comprobantes_pago_medicos" ADD CONSTRAINT "comprobantes_pago_medicos_medicoId_fkey" FOREIGN KEY ("medicoId") REFERENCES "medicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comprobantes_pago_medicos" ADD CONSTRAINT "comprobantes_pago_medicos_cajaDiariaId_fkey" FOREIGN KEY ("cajaDiariaId") REFERENCES "cajas_diarias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comprobantes_pago_medicos" ADD CONSTRAINT "comprobantes_pago_medicos_usuarioCreadorId_fkey" FOREIGN KEY ("usuarioCreadorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
