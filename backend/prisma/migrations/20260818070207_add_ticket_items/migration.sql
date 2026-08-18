-- CreateTable
CREATE TABLE "ticket_items" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "tarifaId" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "precioUnitario" DECIMAL(10,2) NOT NULL,
    "comisionMedico" DECIMAL(10,2) NOT NULL,
    "comisionClinica" DECIMAL(10,2) NOT NULL,
    "comisionTecnico" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "ticket_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ticket_items_ticketId_idx" ON "ticket_items"("ticketId");

-- CreateIndex
CREATE INDEX "ticket_items_tarifaId_idx" ON "ticket_items"("tarifaId");

-- AddForeignKey
ALTER TABLE "ticket_items" ADD CONSTRAINT "ticket_items_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_items" ADD CONSTRAINT "ticket_items_tarifaId_fkey" FOREIGN KEY ("tarifaId") REFERENCES "tarifas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
