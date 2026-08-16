import { Activity } from 'lucide-react';
import type { CajaDiaria, EstadoAtencion, Ticket } from '../api';

interface QueuePanelProps {
  tickets: Ticket[];
  caja: CajaDiaria | null;
  onUpdateEstadoAtencion: (ticketId: number, nextEstado: EstadoAtencion) => void;
}

export function QueuePanel({ tickets, caja, onUpdateEstadoAtencion }: QueuePanelProps) {
  return (
    <div className="white-card rounded-lg p-6 shadow-sm border border-zinc-200 space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
            <Activity className="h-4 w-4 text-zinc-900" /> Sala de Espera y Cola de Atención Médica
          </h2>
          <p className="text-xs text-zinc-555">Gestión de llamados a consultorio en tiempo real</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['ESPERA', 'CONSULTORIO', 'ATENDIDO'] as EstadoAtencion[]).map((est) => {
          const list = tickets.filter(
            (t) => caja && t.cajaDiariaId === caja.id && (t.estadoAtencion || 'ESPERA') === est
          );
          const title = est === 'ESPERA' ? 'En Sala de Espera' : est === 'CONSULTORIO' ? 'En Consultorio' : 'Atendidos';
          const badgeColor =
            est === 'ESPERA'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : est === 'CONSULTORIO'
                ? 'bg-zinc-100 text-zinc-800 border-zinc-250'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200';

          return (
            <div key={est} className="bg-zinc-50/50 p-4 rounded-lg border border-zinc-200 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                <span className="font-semibold text-zinc-800 text-xs">{title}</span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${badgeColor}`}>{list.length}</span>
              </div>

              <div className="space-y-2">
                {list.length === 0 ? (
                  <p className="text-xs text-zinc-400 text-center py-6">Sin pacientes en este estado.</p>
                ) : (
                  list.map((tk) => (
                    <div key={tk.id} className="bg-white p-3 rounded-md border border-zinc-200 space-y-2 shadow-sm">
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-xs text-zinc-900">{tk.paciente?.nombre}</span>
                        <span className="text-[10px] font-mono text-zinc-400">{tk.numeroTicket}</span>
                      </div>
                      <div className="text-[11px] text-zinc-550">
                        Dr. {tk.medico?.nombre} ({tk.consultorio})
                      </div>

                      <div className="flex gap-1 pt-1">
                        {est === 'ESPERA' && (
                          <button
                            onClick={() => onUpdateEstadoAtencion(tk.id, 'CONSULTORIO')}
                            className="w-full bg-zinc-900 hover:bg-zinc-900/90 text-zinc-50 font-medium text-[10px] py-1 rounded transition"
                          >
                            Llamar a Consultorio
                          </button>
                        )}
                        {est === 'CONSULTORIO' && (
                          <button
                            onClick={() => onUpdateEstadoAtencion(tk.id, 'ATENDIDO')}
                            className="w-full bg-zinc-900 hover:bg-zinc-900/90 text-zinc-50 font-medium text-[10px] py-1 rounded transition"
                          >
                            Marcar Atendido
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
