-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ADMINISTRADOR', 'RECEPCIONISTA');

-- CreateEnum
CREATE TYPE "EstadoTicket" AS ENUM ('ACTIVO', 'ANULADO');

-- CreateEnum
CREATE TYPE "TipoEgreso" AS ENUM ('GASTO', 'PLANILLA', 'PAGO_FIJO', 'DEVOLUCION', 'ASCENSOR', 'COMISION', 'OTROS');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'PLIN', 'TRANSFERENCIA', 'TARJETA');

-- CreateEnum
CREATE TYPE "EstadoSunat" AS ENUM ('PENDIENTE', 'PROCESANDO', 'EMITIDO', 'ERROR');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "contrasena" TEXT NOT NULL,
    "rol" "RolUsuario" NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procedencias" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "distrito" TEXT,
    "provincia" TEXT,
    "departamento" TEXT,

    CONSTRAINT "procedencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pacientes" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "celular" TEXT,
    "numeroHistoriaClinica" TEXT,
    "procedenciaId" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pacientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicos" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "especialidad" TEXT NOT NULL,
    "grado" TEXT NOT NULL,
    "celular" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarifas" (
    "id" SERIAL NOT NULL,
    "categoria" TEXT NOT NULL,
    "especialidad" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "precioTotal" DECIMAL(10,2) NOT NULL,
    "tipoReparto" TEXT NOT NULL,
    "comisionMedico" DECIMAL(10,2) NOT NULL,
    "comisionClinica" DECIMAL(10,2) NOT NULL,
    "requiereTecnico" BOOLEAN NOT NULL DEFAULT false,
    "comisionTecnico" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tarifas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cajas_diarias" (
    "id" SERIAL NOT NULL,
    "fecha" DATE NOT NULL,
    "montoApertura" DECIMAL(10,2) NOT NULL,
    "montoEfectivoEsperado" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "montoEfectivoReal" DECIMAL(10,2),
    "diferenciaCierre" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "montoDigitalEsperado" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "fechaApertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaCierre" TIMESTAMP(3),
    "abierta" BOOLEAN NOT NULL DEFAULT true,
    "observaciones" TEXT,
    "usuarioAperturaId" INTEGER NOT NULL,
    "usuarioCierreId" INTEGER,

    CONSTRAINT "cajas_diarias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "liquidaciones_medicos" (
    "id" SERIAL NOT NULL,
    "medicoId" INTEGER NOT NULL,
    "fechaLiquidacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodoInicio" TIMESTAMP(3) NOT NULL,
    "periodoFin" TIMESTAMP(3) NOT NULL,
    "montoTotal" DECIMAL(10,2) NOT NULL,
    "comentarios" TEXT,
    "egresoId" INTEGER,

    CONSTRAINT "liquidaciones_medicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" SERIAL NOT NULL,
    "numeroTicket" TEXT NOT NULL,
    "numeroBoleta" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pacienteId" INTEGER NOT NULL,
    "medicoId" INTEGER NOT NULL,
    "medicoSolicitanteId" INTEGER,
    "tarifaId" INTEGER NOT NULL,
    "descripcionAdicional" TEXT,
    "metodoPago" "MetodoPago" NOT NULL,
    "montoPaciente" DECIMAL(10,2) NOT NULL,
    "montoMedico" DECIMAL(10,2) NOT NULL,
    "montoClinica" DECIMAL(10,2) NOT NULL,
    "montoTecnico" DECIMAL(10,2) NOT NULL,
    "nombreTecnico" TEXT,
    "certificadoFormulario" TEXT,
    "certificadoNumero" TEXT,
    "solicitanteHistoriaClinica" TEXT,
    "estado" "EstadoTicket" NOT NULL DEFAULT 'ACTIVO',
    "cajaDiariaId" INTEGER NOT NULL,
    "sunatEstado" "EstadoSunat" NOT NULL DEFAULT 'PENDIENTE',
    "sunatError" TEXT,
    "sunatXmlPath" TEXT,
    "sunatPdfPath" TEXT,
    "sunatNotaCreditoNumero" TEXT,
    "sunatNotaCreditoEstado" "EstadoSunat",
    "sunatNotaCreditoXmlPath" TEXT,
    "sunatNotaCreditoPdfPath" TEXT,
    "sunatNotaCreditoError" TEXT,
    "usuarioCreadorId" INTEGER NOT NULL,
    "liquidacionId" INTEGER,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "egresos" (
    "id" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipoEgreso" "TipoEgreso" NOT NULL,
    "subcategoria" TEXT,
    "numeroComprobante" TEXT,
    "proveedor" TEXT,
    "ruc" TEXT,
    "observaciones" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "ticketAnuladoId" INTEGER,
    "cajaDiariaId" INTEGER NOT NULL,
    "usuarioEgresoId" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "egresos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "depositos" (
    "id" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "banco" TEXT NOT NULL,
    "numeroOperacion" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "cajaDiariaId" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "depositos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dietas" (
    "id" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "desayunoCant" INTEGER NOT NULL DEFAULT 0,
    "almuerzoCant" INTEGER NOT NULL DEFAULT 0,
    "cenaCant" INTEGER NOT NULL DEFAULT 0,
    "observaciones" TEXT,
    "monto" DECIMAL(10,2) NOT NULL,
    "cajaDiariaId" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dietas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_usuario_key" ON "usuarios"("usuario");

-- CreateIndex
CREATE UNIQUE INDEX "procedencias_nombre_key" ON "procedencias"("nombre");

-- CreateIndex
CREATE INDEX "pacientes_nombre_idx" ON "pacientes"("nombre");

-- CreateIndex
CREATE INDEX "pacientes_celular_idx" ON "pacientes"("celular");

-- CreateIndex
CREATE UNIQUE INDEX "medicos_nombre_key" ON "medicos"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "liquidaciones_medicos_egresoId_key" ON "liquidaciones_medicos"("egresoId");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_numeroTicket_key" ON "tickets"("numeroTicket");

-- CreateIndex
CREATE INDEX "tickets_fecha_idx" ON "tickets"("fecha");

-- CreateIndex
CREATE INDEX "tickets_medicoId_idx" ON "tickets"("medicoId");

-- CreateIndex
CREATE INDEX "tickets_cajaDiariaId_idx" ON "tickets"("cajaDiariaId");

-- CreateIndex
CREATE INDEX "egresos_fecha_idx" ON "egresos"("fecha");

-- CreateIndex
CREATE INDEX "egresos_cajaDiariaId_idx" ON "egresos"("cajaDiariaId");

-- CreateIndex
CREATE INDEX "depositos_fecha_idx" ON "depositos"("fecha");

-- CreateIndex
CREATE INDEX "depositos_cajaDiariaId_idx" ON "depositos"("cajaDiariaId");

-- CreateIndex
CREATE INDEX "dietas_fecha_idx" ON "dietas"("fecha");

-- CreateIndex
CREATE INDEX "dietas_cajaDiariaId_idx" ON "dietas"("cajaDiariaId");

-- AddForeignKey
ALTER TABLE "pacientes" ADD CONSTRAINT "pacientes_procedenciaId_fkey" FOREIGN KEY ("procedenciaId") REFERENCES "procedencias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cajas_diarias" ADD CONSTRAINT "cajas_diarias_usuarioAperturaId_fkey" FOREIGN KEY ("usuarioAperturaId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cajas_diarias" ADD CONSTRAINT "cajas_diarias_usuarioCierreId_fkey" FOREIGN KEY ("usuarioCierreId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liquidaciones_medicos" ADD CONSTRAINT "liquidaciones_medicos_medicoId_fkey" FOREIGN KEY ("medicoId") REFERENCES "medicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liquidaciones_medicos" ADD CONSTRAINT "liquidaciones_medicos_egresoId_fkey" FOREIGN KEY ("egresoId") REFERENCES "egresos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_medicoId_fkey" FOREIGN KEY ("medicoId") REFERENCES "medicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_medicoSolicitanteId_fkey" FOREIGN KEY ("medicoSolicitanteId") REFERENCES "medicos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_tarifaId_fkey" FOREIGN KEY ("tarifaId") REFERENCES "tarifas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_cajaDiariaId_fkey" FOREIGN KEY ("cajaDiariaId") REFERENCES "cajas_diarias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_usuarioCreadorId_fkey" FOREIGN KEY ("usuarioCreadorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_liquidacionId_fkey" FOREIGN KEY ("liquidacionId") REFERENCES "liquidaciones_medicos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "egresos" ADD CONSTRAINT "egresos_cajaDiariaId_fkey" FOREIGN KEY ("cajaDiariaId") REFERENCES "cajas_diarias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "egresos" ADD CONSTRAINT "egresos_usuarioEgresoId_fkey" FOREIGN KEY ("usuarioEgresoId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "depositos" ADD CONSTRAINT "depositos_cajaDiariaId_fkey" FOREIGN KEY ("cajaDiariaId") REFERENCES "cajas_diarias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dietas" ADD CONSTRAINT "dietas_cajaDiariaId_fkey" FOREIGN KEY ("cajaDiariaId") REFERENCES "cajas_diarias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
