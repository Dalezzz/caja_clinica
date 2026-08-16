import { Activity, Receipt } from 'lucide-react';
import type { Ticket } from '../api';

interface PosOverviewPanelProps {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
  onOpenHistory: () => void;
}

export function PosOverviewPanel({ tickets, onSelectTicket, onOpenHistory }: PosOverviewPanelProps) {
  return (
    <div className="lg:col-span-5 space-y-5">
      <div className="white-card rounded-lg p-5 shadow-sm border border-zinc-200 space-y-3">
        <h3 className="font-semibold text-zinc-900 text-xs flex items-center gap-2 border-b border-zinc-100 pb-2">
          <Activity className="h-4 w-4 text-zinc-800" /> Resumen de Atenciones del Turno
        </h3>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-zinc-50/50 p-3 rounded-lg border border-zinc-200">
            <div className="text-[10px] text-zinc-500 font-medium uppercase">Emitidos Hoy</div>
            <div className="text-xl font-bold text-zinc-950 mt-1">{tickets.length}</div>
            <div className="text-[9px] text-zinc-400 mt-1">Comprobantes</div>
          </div>
          <div className="bg-zinc-50/50 p-3 rounded-lg border border-zinc-200">
            <div className="text-[10px] text-zinc-500 font-medium uppercase">Recaudado Bruto</div>
            <div className="text-xl font-bold text-zinc-950 mt-1">
              S/ {tickets.reduce((sum, t) => sum + Number(t.montoPaciente), 0).toFixed(2)}
            </div>
            <div className="text-[9px] text-zinc-450 mt-1">Efectivo + Digital</div>
          </div>
        </div>
      </div>

      <div className="white-card rounded-lg p-5 shadow-sm border border-zinc-200 space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
          <h3 className="font-semibold text-zinc-900 text-xs flex items-center gap-2">
            <Receipt className="h-4 w-4 text-zinc-850" /> Histórico de Comprobantes
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-500 font-medium">{tickets.length} registros</span>
            <button
              type="button"
              onClick={onOpenHistory}
              className="bg-zinc-100 hover:bg-zinc-200 text-zinc-850 font-semibold border border-zinc-300 rounded px-2 py-0.5 text-[10px] transition"
            >
              Ver Todo / Filtrar
            </button>
          </div>
        </div>

        <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
          {tickets.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 text-xs">
              No hay comprobantes emitidos en el turno actual.
            </div>
          ) : (
            tickets.slice(0, 50).map((t) => (
              <div
                key={t.id}
                className="bg-zinc-50/30 hover:bg-zinc-50/80 p-3 rounded-md border border-zinc-250/70 flex items-center justify-between transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-semibold text-zinc-900">{t.numeroBoleta || t.numeroTicket}</span>
                    <span className="bg-zinc-100 text-zinc-800 border border-zinc-200 text-[9px] font-medium px-1.5 py-0.5 rounded uppercase">
                      {(t.tipoComprobante || (t.numeroBoleta ? 'BOLETA_ELECTRONICA' : 'TICKET_INTERNO')).replace('_ELECTRONICA', '').replace('_INTERNO', '')}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-zinc-950">{t.paciente?.nombre}</div>
                  <div className="text-[11px] text-zinc-500">
                    Dr. {t.medico?.nombre} • {t.consultorio}
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div className="text-sm font-semibold text-zinc-950">S/ {Number(t.montoPaciente).toFixed(2)}</div>
                  <button
                    type="button"
                    onClick={() => onSelectTicket(t)}
                    className="text-[11px] text-zinc-800 hover:text-zinc-950 hover:underline flex items-center gap-1 justify-end ml-auto font-medium transition"
                  >
                    <Receipt className="h-3 w-3" /> Imprimir
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
