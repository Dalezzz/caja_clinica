import { Users } from 'lucide-react';
import type { Medico, Ticket } from '../api';

interface LiquidacionesPanelProps {
  medicos: Medico[];
  tickets: Ticket[];
  liqSearch: string;
  liqSpecialty: string;
  liqDateFrom: string;
  liqDateTo: string;
  onLiqSearchChange: (value: string) => void;
  onLiqSpecialtyChange: (value: string) => void;
  onLiqDateFromChange: (value: string) => void;
  onLiqDateToChange: (value: string) => void;
  onResetFilters: () => void;
}

export function LiquidacionesPanel({
  medicos,
  tickets,
  liqSearch,
  liqSpecialty,
  liqDateFrom,
  liqDateTo,
  onLiqSearchChange,
  onLiqSpecialtyChange,
  onLiqDateFromChange,
  onLiqDateToChange,
  onResetFilters,
}: LiquidacionesPanelProps) {
  const specialties = Array.from(new Set(medicos.map((m) => m.especialidad).filter(Boolean)));

  const filteredMedicos = medicos.filter((med) => {
    if (liqSearch) {
      const term = liqSearch.toLowerCase().trim();
      if (!med.nombre.toLowerCase().includes(term)) return false;
    }
    if (liqSpecialty && med.especialidad !== liqSpecialty) return false;
    return true;
  });

  return (
    <div className="white-card rounded-lg p-6 border border-zinc-200 shadow-sm space-y-6">
      <div className="border-b border-zinc-100 pb-4">
        <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
          <Users className="h-4 w-4 text-zinc-900" /> Liquidación de Comisiones por Médico CMP
        </h2>
        <p className="text-xs text-zinc-550">Cálculo de honorarios profesionales según tarifario oficial</p>
      </div>

      <div className="bg-zinc-50/50 p-4 border border-zinc-200 rounded-lg grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
        <div className="md:col-span-2">
          <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Nombre Médico</label>
          <input
            type="text"
            placeholder="Ej. Perez, Ramirez..."
            value={liqSearch}
            onChange={(e) => onLiqSearchChange(e.target.value)}
            className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
          />
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Especialidad</label>
          <select
            value={liqSpecialty}
            onChange={(e) => onLiqSpecialtyChange(e.target.value)}
            className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-800 font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
          >
            <option value="">-- Todas --</option>
            {specialties.map((esp, idx) => (
              <option key={idx} value={esp}>{esp}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Desde Fecha</label>
          <input
            type="date"
            value={liqDateFrom}
            onChange={(e) => onLiqDateFromChange(e.target.value)}
            className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-xs text-zinc-800 focus-visible:outline-none"
          />
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Hasta Fecha</label>
          <input
            type="date"
            value={liqDateTo}
            onChange={(e) => onLiqDateToChange(e.target.value)}
            className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-xs text-zinc-800 focus-visible:outline-none"
          />
        </div>

        <div className="md:col-span-5 flex justify-end gap-2 text-xs pt-1">
          <button
            type="button"
            onClick={onResetFilters}
            className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold border border-zinc-200 rounded-md px-3 py-1 transition"
          >
            Limpiar Filtros
          </button>
        </div>
      </div>

      {filteredMedicos.length === 0 ? (
        <div className="text-center py-12 text-zinc-400 text-xs">
          No se encontraron médicos coincidentes con los filtros.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMedicos.map((med) => {
            const doctorTickets = tickets.filter((t) => {
              if (t.medicoId !== med.id) return false;
              if (t.estado !== 'ACTIVO') return false;

              if (liqDateFrom) {
                const dateFromObj = new Date(liqDateFrom);
                dateFromObj.setHours(0, 0, 0, 0);
                if (new Date(t.fecha) < dateFromObj) return false;
              }
              if (liqDateTo) {
                const dateToObj = new Date(liqDateTo);
                dateToObj.setHours(23, 59, 59, 999);
                if (new Date(t.fecha) > dateToObj) return false;
              }

              return true;
            });

            const totalComision = doctorTickets.reduce((sum, t) => sum + Number(t.montoMedico), 0);

            return (
              <div key={med.id} className="bg-zinc-50/50 p-4 rounded-md border border-zinc-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-zinc-900 text-xs">{med.nombre}</div>
                  <span className="bg-zinc-100 text-zinc-800 border border-zinc-200 text-[9px] font-medium px-2 py-0.5 rounded">
                    CMP: {med.cmp || 'N/A'}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-zinc-200/60 pt-2 text-[11px]">
                  <span className="text-zinc-500">Especialidad:</span>
                  <span className="font-medium text-zinc-800">{med.especialidad}</span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-dashed border-zinc-200/60 mt-1">
                  <span className="text-zinc-500 font-medium">Comprobantes ({doctorTickets.length}):</span>
                  <span className="font-medium text-zinc-800">
                    S/ {doctorTickets.reduce((sum, t) => sum + Number(t.montoPaciente), 0).toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-200/60">
                  <span className="text-zinc-505 font-semibold text-zinc-900">Total Comisión Médico:</span>
                  <span className="font-bold text-emerald-700">S/ {totalComision.toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
