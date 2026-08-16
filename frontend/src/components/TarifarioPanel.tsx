import { Layers } from 'lucide-react';
import type { Tarifa } from '../api';

interface TarifarioPanelProps {
  tarifas: Tarifa[];
  tarSearch: string;
  tarCategory: string;
  onTarSearchChange: (value: string) => void;
  onTarCategoryChange: (value: string) => void;
  onResetFilters: () => void;
}

export function TarifarioPanel({
  tarifas,
  tarSearch,
  tarCategory,
  onTarSearchChange,
  onTarCategoryChange,
  onResetFilters,
}: TarifarioPanelProps) {
  const categories = Array.from(new Set(tarifas.map((t) => t.categoria).filter(Boolean)));

  const filteredTarifas = tarifas.filter((tf) => {
    if (tarSearch) {
      const term = tarSearch.toLowerCase().trim();
      const matchesDesc = tf.descripcion.toLowerCase().includes(term);
      const matchesEsp = tf.especialidad.toLowerCase().includes(term);
      if (!matchesDesc && !matchesEsp) return false;
    }
    if (tarCategory && tf.categoria !== tarCategory) return false;
    return true;
  });

  return (
    <div className="white-card rounded-lg p-6 border border-zinc-200 shadow-sm space-y-6">
      <div className="border-b border-zinc-100 pb-4">
        <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
          <Layers className="h-4 w-4 text-zinc-900" /> Tarifario Oficial de Servicios Médicos
        </h2>
        <p className="text-xs text-zinc-550">Costos para pacientes y reparto porcentual/fijo por convenio</p>
      </div>

      <div className="bg-zinc-50/50 p-4 border border-zinc-200 rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Buscar Servicio / Especialidad</label>
          <input
            type="text"
            placeholder="Ej. Consulta general, ginecologia, ecografía..."
            value={tarSearch}
            onChange={(e) => onTarSearchChange(e.target.value)}
            className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
          />
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Categoría</label>
          <select
            value={tarCategory}
            onChange={(e) => onTarCategoryChange(e.target.value)}
            className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-800 font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
          >
            <option value="">-- Todas --</option>
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-3 flex justify-end gap-2 text-xs pt-1">
          <button
            type="button"
            onClick={onResetFilters}
            className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold border border-zinc-200 rounded-md px-3 py-1 transition"
          >
            Limpiar Filtros
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-zinc-200 rounded-lg">
        {filteredTarifas.length === 0 ? (
          <div className="text-center py-12 text-zinc-400 text-xs bg-white">
            No se encontraron servicios coincidentes con los filtros.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-zinc-50 text-zinc-500 uppercase font-semibold text-[10px] tracking-wider border-b border-zinc-200">
                <th className="p-3">Categoría</th>
                <th className="p-3">Descripción</th>
                <th className="p-3">Precio Paciente</th>
                <th className="p-3">Pago Médico</th>
                <th className="p-3">Clínica Neto</th>
                <th className="p-3">Técnico Placas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {filteredTarifas.map((tf) => (
                <tr key={tf.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="p-3 font-semibold text-zinc-900">{tf.categoria}</td>
                  <td className="p-3 text-zinc-700">{tf.descripcion}</td>
                  <td className="p-3 font-semibold text-zinc-950">S/ {Number(tf.precioTotal).toFixed(2)}</td>
                  <td className="p-3 text-zinc-800">S/ {Number(tf.comisionMedico).toFixed(2)}</td>
                  <td className="p-3 text-zinc-800">S/ {Number(tf.comisionClinica).toFixed(2)}</td>
                  <td className="p-3 text-zinc-500">{tf.requiereTecnico ? 'Samuel (S/ 5.00)' : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
