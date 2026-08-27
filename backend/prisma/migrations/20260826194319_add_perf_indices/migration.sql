-- CreateIndex
CREATE INDEX "movimientos_kardex_productoId_fecha_idx" ON "movimientos_kardex"("productoId", "fecha");

-- CreateIndex
CREATE INDEX "tickets_medicoId_fecha_estado_idx" ON "tickets"("medicoId", "fecha", "estado");
