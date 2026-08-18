import { Printer, XCircle } from "lucide-react";
import type { Ticket } from "../api";

interface TicketPrintModalProps {
  ticket: Ticket | null;
  onClose: () => void;
}

export function TicketPrintModal({ ticket, onClose }: TicketPrintModalProps) {
  if (!ticket) return null;

  return (
    <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 border border-zinc-200 max-w-md w-full space-y-4 shadow-lg animate-in fade-in-50 zoom-in-95">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <h3 className="font-semibold text-zinc-900 text-xs flex items-center gap-2">
            <Printer className="h-4 w-4 text-zinc-800" /> Vista Previa
            Comprobante Clínico (80mm)
          </h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-900 transition"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>

        <div
          id="printable-ticket"
          className="bg-white text-zinc-950 p-4 rounded-md font-mono text-xs space-y-2 border border-zinc-200 shadow-inner"
        >
          <div className="text-center font-bold text-sm">
            CENTRO MÉDICO MEDIC
          </div>
          <div className="text-center text-[10px]">
            RUC: 20601234567 • Tel: (044) 554433
          </div>
          <div className="text-center text-[10px]">
            Ciudad de Dios - Guadalupe - La Libertad
          </div>
          <div className="border-b border-dashed border-zinc-400 my-2"></div>

          <div className="text-center font-bold uppercase text-xs">
            {(
              ticket.tipoComprobante ||
              (ticket.numeroBoleta ? "BOLETA_ELECTRONICA" : "TICKET_INTERNO")
            )
              .replace("_ELECTRONICA", " ELECTRÓNICA")
              .replace("_INTERNO", " INTERNO")}
          </div>
          <div className="text-center font-bold text-xs">
            {ticket.numeroBoleta || ticket.numeroTicket}
          </div>
          <div className="text-center text-[10px]">
            FECHA: {new Date(ticket.fecha).toLocaleString()}
          </div>
          <div className="border-b border-dashed border-zinc-400 my-1"></div>

          <div>PACIENTE: {ticket.paciente?.nombre}</div>
          <div>DOC. IDENT: {ticket.paciente?.numeroDocumento || "S/N"}</div>
          <div>
            HIST. CLIN: {ticket.paciente?.numeroHistoriaClinica || "N/A"}
          </div>
          <div>
            PROCEDENCIA:{" "}
            {ticket.paciente?.procedencia?.nombre || "Ciudad de Dios"}
          </div>
          <div className="border-b border-dashed border-zinc-400 my-1"></div>

          <div>MÉDICO TRATANTE: {ticket.medico?.nombre}</div>
          <div>CMP: {ticket.medico?.cmp || "S/N"}</div>
          <div>CONSULTORIO: {ticket.consultorio}</div>
          <div className="border-b border-dashed border-zinc-400 my-1"></div>

          <div className="font-bold border-b border-zinc-300 pb-1">
            DESCRIPCIÓN DE ATENCIONES:
          </div>
          {ticket.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-[11px]">
              <span>
                {item.descripcion} (x{item.cantidad})
              </span>
              <span>S/ {(item.precioUnitario * item.cantidad).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-b border-dashed border-zinc-400 my-1"></div>

          <div className="flex justify-between font-bold text-sm pt-1">
            <span>TOTAL A PAGAR:</span>
            <span>S/ {Number(ticket.montoPaciente).toFixed(2)}</span>
          </div>
          <div className="text-[10px]">MÉTODO DE PAGO: {ticket.metodoPago}</div>
          <div className="border-b border-dashed border-zinc-400 my-2"></div>

          <div className="text-center text-[10px] font-bold">
            ¡Conserve este ticket para ser llamado a consultorio!
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex-1 bg-zinc-900 hover:bg-zinc-900/90 text-zinc-50 font-medium py-2 rounded-md shadow transition text-xs flex items-center justify-center gap-2"
          >
            <Printer className="h-4 w-4" /> IMPRIMIR VOUCHER 80MM
          </button>
          <button
            onClick={onClose}
            className="px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-medium py-2 rounded-md border border-zinc-200 shadow-sm transition text-xs"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
