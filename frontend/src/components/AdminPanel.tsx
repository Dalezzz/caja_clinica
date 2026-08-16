import { AlertTriangle, Building, CheckCircle2, Layers, Pencil, Plus, Save, Settings, Trash2, UserPlus, X } from 'lucide-react';
import type { Medico, Procedencia, Tarifa } from '../api';

interface AdminPanelProps {
  medicos: Medico[];
  tarifas: Tarifa[];
  procedencias: Procedencia[];
  adminSaving: boolean;
  adminError: string | null;
  adminSuccess: string | null;
  editingMedicoId: number | null;
  editingMedicoData: Partial<Medico>;
  editingTarifaId: number | null;
  editingTarifaData: Partial<Tarifa>;
  editingProcId: number | null;
  editingProcData: Partial<Procedencia>;
  showAddMedico: boolean;
  newMedicoData: Partial<Medico>;
  newMedicoErrors: Partial<Record<keyof Medico, string>>;
  showAddTarifa: boolean;
  newTarifaData: Partial<Tarifa>;
  newTarifaErrors: Partial<Record<keyof Tarifa, string>>;
  showAddProc: boolean;
  newProcData: Partial<Procedencia>;
  newProcErrors: Partial<Record<keyof Procedencia, string>>;
  onSetEditingMedicoId: (value: number | null) => void;
  onSetEditingMedicoData: (value: Partial<Medico>) => void;
  onSetEditingTarifaId: (value: number | null) => void;
  onSetEditingTarifaData: (value: Partial<Tarifa>) => void;
  onSetEditingProcId: (value: number | null) => void;
  onSetEditingProcData: (value: Partial<Procedencia>) => void;
  onSetShowAddMedico: (value: boolean) => void;
  onSetNewMedicoData: (value: Partial<Medico>) => void;
  onSetNewMedicoErrors: (value: Partial<Record<keyof Medico, string>>) => void;
  onSetShowAddTarifa: (value: boolean) => void;
  onSetNewTarifaData: (value: Partial<Tarifa>) => void;
  onSetNewTarifaErrors: (value: Partial<Record<keyof Tarifa, string>>) => void;
  onSetShowAddProc: (value: boolean) => void;
  onSetNewProcData: (value: Partial<Procedencia>) => void;
  onSetNewProcErrors: (value: Partial<Record<keyof Procedencia, string>>) => void;
  onSetAdminError: (value: string | null) => void;
  onSaveMedico: (id: number) => void;
  onDeleteMedico: (id: number) => void;
  onSaveTarifa: (id: number) => void;
  onDeleteProc: (id: number) => void;
  onSaveProc: (id: number) => void;
  onCreateMedico: () => void;
  onCreateTarifa: () => void;
  onCreateProc: () => void;
}

export function AdminPanel({
  medicos,
  tarifas,
  procedencias,
  adminSaving,
  adminError,
  adminSuccess,
  editingMedicoId,
  editingMedicoData,
  editingTarifaId,
  editingTarifaData,
  editingProcId,
  editingProcData,
  showAddMedico,
  newMedicoData,
  newMedicoErrors,
  showAddTarifa,
  newTarifaData,
  newTarifaErrors,
  showAddProc,
  newProcData,
  newProcErrors,
  onSetEditingMedicoId,
  onSetEditingMedicoData,
  onSetEditingTarifaId,
  onSetEditingTarifaData,
  onSetEditingProcId,
  onSetEditingProcData,
  onSetShowAddMedico,
  onSetNewMedicoData,
  onSetNewMedicoErrors,
  onSetShowAddTarifa,
  onSetNewTarifaData,
  onSetNewTarifaErrors,
  onSetShowAddProc,
  onSetNewProcData,
  onSetNewProcErrors,
  onSetAdminError,
  onSaveMedico,
  onDeleteMedico,
  onSaveTarifa,
  onDeleteProc,
  onSaveProc,
  onCreateMedico,
  onCreateTarifa,
  onCreateProc,
}: AdminPanelProps) {
  return (
    <div className="space-y-6">
      <div className="white-card rounded-lg p-5 border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-zinc-900 flex items-center justify-center">
            <Settings className="h-4 w-4 text-zinc-50" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Configuración & Administración</h2>
            <p className="text-xs text-zinc-500">Edita médicos (CMP incluido), tarifas y procedencias. Los cambios se guardan en la base de datos al instante.</p>
          </div>
        </div>

        {adminSuccess && (
          <div className="mt-3 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium px-3 py-2 rounded-md">
            <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" /> {adminSuccess}
          </div>
        )}
        {adminError && (
          <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-3 py-2 rounded-md">
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" /> {adminError}
            <button onClick={() => onSetAdminError(null)} className="ml-auto text-red-400 hover:text-red-700"><X className="h-3 w-3" /></button>
          </div>
        )}
      </div>

      <div className="white-card rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-zinc-700" /> Gestión de Médicos
            <span className="text-[10px] font-medium bg-zinc-100 text-zinc-500 border border-zinc-200 px-2 py-0.5 rounded-full">{medicos.length} registros</span>
          </h3>
          <div className="flex items-center gap-3">
            <p className="text-[11px] text-zinc-400">Edita nombre, especialidad, CMP y consultorio asignado.</p>
            <button
              onClick={() => { onSetShowAddMedico(true); onSetNewMedicoData({}); onSetAdminError(null); }}
              className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[12px] font-medium px-3 py-1.5 rounded border border-emerald-200"
            >
              <Plus className="h-4 w-4" /> Agregar
            </button>
          </div>
        </div>

        {showAddMedico && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold">Agregar Médico</h4>
                <button onClick={() => { onSetShowAddMedico(false); onSetNewMedicoErrors({}); }} className="text-zinc-500"><X className="h-5 w-5" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px]">Nombre</label>
                  <input className="w-full border px-2 py-1 text-xs rounded" value={newMedicoData.nombre ?? ''} onChange={e => onSetNewMedicoData({ ...newMedicoData, nombre: e.target.value })} />
                  {newMedicoErrors.nombre && <div className="text-red-600 text-xs mt-1">{newMedicoErrors.nombre}</div>}
                </div>
                <div>
                  <label className="text-[12px]">Especialidad</label>
                  <input className="w-full border px-2 py-1 text-xs rounded" value={newMedicoData.especialidad ?? ''} onChange={e => onSetNewMedicoData({ ...newMedicoData, especialidad: e.target.value })} />
                  {newMedicoErrors.especialidad && <div className="text-red-600 text-xs mt-1">{newMedicoErrors.especialidad}</div>}
                </div>
                <div>
                  <label className="text-[12px]">Grado</label>
                  <select className="w-full border px-2 py-1 text-xs rounded" value={newMedicoData.grado ?? 'Doctor'} onChange={e => onSetNewMedicoData({ ...newMedicoData, grado: e.target.value })}>
                    <option>Doctor</option>
                    <option>Doctora</option>
                    <option>Licenciado</option>
                    <option>Licenciada</option>
                    <option>Técnico</option>
                  </select>
                  {newMedicoErrors.grado && <div className="text-red-600 text-xs mt-1">{newMedicoErrors.grado}</div>}
                </div>
                <div>
                  <label className="text-[12px]">CMP</label>
                  <input className="w-full border px-2 py-1 text-xs rounded" value={newMedicoData.cmp ?? ''} onChange={e => onSetNewMedicoData({ ...newMedicoData, cmp: e.target.value })} />
                </div>
                <div>
                  <label className="text-[12px]">Consultorio</label>
                  <input className="w-full border px-2 py-1 text-xs rounded" value={newMedicoData.consultorioAsignado ?? ''} onChange={e => onSetNewMedicoData({ ...newMedicoData, consultorioAsignado: e.target.value })} />
                </div>
                <div>
                  <label className="text-[12px]">Celular</label>
                  <input className="w-full border px-2 py-1 text-xs rounded" value={newMedicoData.celular ?? ''} onChange={e => onSetNewMedicoData({ ...newMedicoData, celular: e.target.value })} />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={onCreateMedico} disabled={adminSaving} className="bg-emerald-900 text-white px-4 py-2 rounded">Guardar</button>
                <button onClick={() => { onSetShowAddMedico(false); onSetNewMedicoData({}); onSetNewMedicoErrors({}); }} className="bg-zinc-100 px-4 py-2 rounded">Cancelar</button>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-zinc-50 text-zinc-500 uppercase text-[10px] font-semibold tracking-wider border-b border-zinc-200">
                <th className="p-3 text-left">Nombre</th>
                <th className="p-3 text-left">Especialidad</th>
                <th className="p-3 text-left">Grado</th>
                <th className="p-3 text-left">CMP</th>
                <th className="p-3 text-left">Consultorio</th>
                <th className="p-3 text-left">Celular</th>
                <th className="p-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {medicos.map(med => (
                <tr key={med.id} className={`transition ${editingMedicoId === med.id ? 'bg-zinc-50/80' : 'hover:bg-zinc-50/40'}`}>
                  {editingMedicoId === med.id ? (
                    <>
                      <td className="p-2">
                        <input className="w-full border border-zinc-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400" value={editingMedicoData.nombre ?? med.nombre} onChange={e => onSetEditingMedicoData({ ...editingMedicoData, nombre: e.target.value })} />
                      </td>
                      <td className="p-2">
                        <input className="w-full border border-zinc-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400" value={editingMedicoData.especialidad ?? med.especialidad} onChange={e => onSetEditingMedicoData({ ...editingMedicoData, especialidad: e.target.value })} />
                      </td>
                      <td className="p-2">
                        <select className="border border-zinc-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400" value={editingMedicoData.grado ?? med.grado} onChange={e => onSetEditingMedicoData({ ...editingMedicoData, grado: e.target.value })}>
                          <option>Doctor</option>
                          <option>Doctora</option>
                          <option>Licenciado</option>
                          <option>Licenciada</option>
                          <option>Técnico</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <input className="w-32 border border-zinc-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400" placeholder="Ej: 078451" value={editingMedicoData.cmp ?? med.cmp ?? ''} onChange={e => onSetEditingMedicoData({ ...editingMedicoData, cmp: e.target.value })} />
                      </td>
                      <td className="p-2">
                        <input className="w-36 border border-zinc-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400" placeholder="Consultorio 1" value={editingMedicoData.consultorioAsignado ?? med.consultorioAsignado ?? ''} onChange={e => onSetEditingMedicoData({ ...editingMedicoData, consultorioAsignado: e.target.value })} />
                      </td>
                      <td className="p-2">
                        <input className="w-28 border border-zinc-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400" placeholder="Celular" value={editingMedicoData.celular ?? med.celular ?? ''} onChange={e => onSetEditingMedicoData({ ...editingMedicoData, celular: e.target.value })} />
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1.5">
                          <button onClick={() => onSaveMedico(med.id)} disabled={adminSaving} className="flex items-center gap-1 bg-zinc-900 hover:bg-zinc-700 text-zinc-50 text-[10px] font-medium px-2.5 py-1.5 rounded transition disabled:opacity-50"><Save className="h-3 w-3" /> Guardar</button>
                          <button onClick={() => { onSetEditingMedicoId(null); onSetEditingMedicoData({}); }} className="flex items-center gap-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[10px] font-medium px-2 py-1.5 rounded border border-zinc-200 transition"><X className="h-3 w-3" /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-3 font-medium text-zinc-900">{med.nombre}</td>
                      <td className="p-3 text-zinc-600">{med.especialidad}</td>
                      <td className="p-3 text-zinc-500">{med.grado}</td>
                      <td className="p-3">{med.cmp ? <span className="font-mono text-zinc-800 bg-zinc-100 px-1.5 py-0.5 rounded text-[10px] border border-zinc-200">{med.cmp}</span> : <span className="text-zinc-300 text-[10px] italic">Sin CMP</span>}</td>
                      <td className="p-3 text-zinc-500 text-[11px]">{med.consultorioAsignado || <span className="text-zinc-300">—</span>}</td>
                      <td className="p-3 text-zinc-500 text-[11px]">{med.celular || <span className="text-zinc-300">—</span>}</td>
                      <td className="p-3">
                        <div className="flex gap-1.5">
                          <button onClick={() => { onSetEditingMedicoId(med.id); onSetEditingMedicoData({}); onSetAdminError(null); }} className="flex items-center gap-1 text-[10px] font-medium text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 px-2 py-1.5 rounded transition"><Pencil className="h-3 w-3" /> Editar</button>
                          <button onClick={() => onDeleteMedico(med.id)} className="flex items-center gap-1 text-[10px] font-medium text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2 py-1.5 rounded transition"><Trash2 className="h-3 w-3" /></button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="white-card rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
            <Layers className="h-4 w-4 text-zinc-700" /> Tarifas & Comisiones
            <span className="text-[10px] font-medium bg-zinc-100 text-zinc-500 border border-zinc-200 px-2 py-0.5 rounded-full">{tarifas.length} registros</span>
          </h3>
          <div className="flex items-center gap-3">
            <p className="text-[11px] text-zinc-400">Edita precios, comisiones de médico, clínica y técnico.</p>
            <button onClick={() => { onSetShowAddTarifa(true); onSetNewTarifaData({ requiereTecnico: false }); onSetAdminError(null); }} className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[12px] font-medium px-3 py-1.5 rounded border border-emerald-200"><Plus className="h-4 w-4" /> Agregar</button>
          </div>
        </div>

        {showAddTarifa && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-3xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold">Agregar Tarifa</h4>
                <button onClick={() => { onSetShowAddTarifa(false); onSetNewTarifaErrors({}); }} className="text-zinc-500"><X className="h-5 w-5" /></button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[12px]">Categoría</label>
                  <input className="w-full border px-2 py-1 text-xs rounded" value={newTarifaData.categoria ?? ''} onChange={e => onSetNewTarifaData({ ...newTarifaData, categoria: e.target.value })} />
                  {newTarifaErrors.categoria && <div className="text-red-600 text-xs mt-1">{newTarifaErrors.categoria}</div>}
                </div>
                <div className="col-span-2">
                  <label className="text-[12px]">Descripción</label>
                  <input className="w-full border px-2 py-1 text-xs rounded" value={newTarifaData.descripcion ?? ''} onChange={e => onSetNewTarifaData({ ...newTarifaData, descripcion: e.target.value })} />
                  {newTarifaErrors.descripcion && <div className="text-red-600 text-xs mt-1">{newTarifaErrors.descripcion}</div>}
                </div>
                <div>
                  <label className="text-[12px]">Precio</label>
                  <input type="number" className="w-full border px-2 py-1 text-xs rounded" value={newTarifaData.precioTotal ?? '' as any} onChange={e => onSetNewTarifaData({ ...newTarifaData, precioTotal: Number(e.target.value) })} />
                  {newTarifaErrors.precioTotal && <div className="text-red-600 text-xs mt-1">{newTarifaErrors.precioTotal}</div>}
                </div>
                <div>
                  <label className="text-[12px]">Comis. Médico</label>
                  <input type="number" className="w-full border px-2 py-1 text-xs rounded" value={newTarifaData.comisionMedico ?? '' as any} onChange={e => onSetNewTarifaData({ ...newTarifaData, comisionMedico: Number(e.target.value) })} />
                  {newTarifaErrors.comisionMedico && <div className="text-red-600 text-xs mt-1">{newTarifaErrors.comisionMedico}</div>}
                </div>
                <div>
                  <label className="text-[12px]">Comis. Clínica</label>
                  <input type="number" className="w-full border px-2 py-1 text-xs rounded" value={newTarifaData.comisionClinica ?? '' as any} onChange={e => onSetNewTarifaData({ ...newTarifaData, comisionClinica: Number(e.target.value) })} />
                  {newTarifaErrors.comisionClinica && <div className="text-red-600 text-xs mt-1">{newTarifaErrors.comisionClinica}</div>}
                </div>
                <div>
                  <label className="text-[12px]">Tipo Reparto</label>
                  <select className="w-full border px-2 py-1 text-xs rounded" value={newTarifaData.tipoReparto ?? 'PORCENTAJE'} onChange={e => onSetNewTarifaData({ ...newTarifaData, tipoReparto: e.target.value })}>
                    <option value="PORCENTAJE">PORCENTAJE</option>
                    <option value="FIJO">FIJO</option>
                    <option value="MIXTO">MIXTO</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input id="reqTec" type="checkbox" checked={newTarifaData.requiereTecnico ?? false} onChange={e => onSetNewTarifaData({ ...newTarifaData, requiereTecnico: e.target.checked })} />
                  <label htmlFor="reqTec" className="text-[12px]">Requiere Técnico</label>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={onCreateTarifa} disabled={adminSaving} className="bg-emerald-900 text-white px-4 py-2 rounded">Guardar</button>
                <button onClick={() => { onSetShowAddTarifa(false); onSetNewTarifaData({ requiereTecnico: false }); onSetNewTarifaErrors({}); }} className="bg-zinc-100 px-4 py-2 rounded">Cancelar</button>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-zinc-50 text-zinc-500 uppercase text-[10px] font-semibold tracking-wider border-b border-zinc-200">
                <th className="p-3 text-left">Categoría</th>
                <th className="p-3 text-left">Descripción</th>
                <th className="p-3 text-left">Precio Total</th>
                <th className="p-3 text-left">Comis. Médico</th>
                <th className="p-3 text-left">Comis. Clínica</th>
                <th className="p-3 text-left">Técnico</th>
                <th className="p-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {tarifas.map(tf => (
                <tr key={tf.id} className={`transition ${editingTarifaId === tf.id ? 'bg-zinc-50/80' : 'hover:bg-zinc-50/40'}`}>
                  {editingTarifaId === tf.id ? (
                    <>
                      <td className="p-2"><input className="w-28 border border-zinc-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400" value={editingTarifaData.categoria ?? tf.categoria} onChange={e => onSetEditingTarifaData({ ...editingTarifaData, categoria: e.target.value })} /></td>
                      <td className="p-2"><input className="w-48 border border-zinc-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400" value={editingTarifaData.descripcion ?? tf.descripcion} onChange={e => onSetEditingTarifaData({ ...editingTarifaData, descripcion: e.target.value })} /></td>
                      <td className="p-2"><input type="number" min="0" className="w-20 border border-zinc-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400" value={editingTarifaData.precioTotal ?? tf.precioTotal} onChange={e => onSetEditingTarifaData({ ...editingTarifaData, precioTotal: Number(e.target.value) })} /></td>
                      <td className="p-2"><input type="number" min="0" className="w-20 border border-zinc-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400" value={editingTarifaData.comisionMedico ?? tf.comisionMedico} onChange={e => onSetEditingTarifaData({ ...editingTarifaData, comisionMedico: Number(e.target.value) })} /></td>
                      <td className="p-2"><input type="number" min="0" className="w-20 border border-zinc-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400" value={editingTarifaData.comisionClinica ?? tf.comisionClinica} onChange={e => onSetEditingTarifaData({ ...editingTarifaData, comisionClinica: Number(e.target.value) })} /></td>
                      <td className="p-2"><label className="flex items-center gap-1.5 text-[10px] text-zinc-600"><input type="checkbox" checked={editingTarifaData.requiereTecnico ?? tf.requiereTecnico} onChange={e => onSetEditingTarifaData({ ...editingTarifaData, requiereTecnico: e.target.checked })} />Técnico</label></td>
                      <td className="p-2"><div className="flex gap-1.5"><button onClick={() => onSaveTarifa(tf.id)} disabled={adminSaving} className="flex items-center gap-1 bg-zinc-900 hover:bg-zinc-700 text-zinc-50 text-[10px] font-medium px-2.5 py-1.5 rounded transition disabled:opacity-50"><Save className="h-3 w-3" /> Guardar</button><button onClick={() => { onSetEditingTarifaId(null); onSetEditingTarifaData({}); }} className="flex items-center gap-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[10px] font-medium px-2 py-1.5 rounded border border-zinc-200 transition"><X className="h-3 w-3" /></button></div></td>
                    </>
                  ) : (
                    <>
                      <td className="p-3 font-semibold text-zinc-900">{tf.categoria}</td>
                      <td className="p-3 text-zinc-600">{tf.descripcion}</td>
                      <td className="p-3 font-semibold text-zinc-950">S/ {Number(tf.precioTotal).toFixed(2)}</td>
                      <td className="p-3 text-zinc-700">S/ {Number(tf.comisionMedico).toFixed(2)}</td>
                      <td className="p-3 text-zinc-700">S/ {Number(tf.comisionClinica).toFixed(2)}</td>
                      <td className="p-3 text-zinc-500 text-[11px]">{tf.requiereTecnico ? 'Samuel (S/ 5)' : '—'}</td>
                      <td className="p-3"><button onClick={() => { onSetEditingTarifaId(tf.id); onSetEditingTarifaData({}); onSetAdminError(null); }} className="flex items-center gap-1 text-[10px] font-medium text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 px-2 py-1.5 rounded transition"><Pencil className="h-3 w-3" /> Editar</button></td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="white-card rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
            <Building className="h-4 w-4 text-zinc-700" /> Procedencias de Pacientes
            <span className="text-[10px] font-medium bg-zinc-100 text-zinc-500 border border-zinc-200 px-2 py-0.5 rounded-full">{procedencias.length} registros</span>
          </h3>
          <div className="flex items-center gap-3">
            <p className="text-[11px] text-zinc-400">Nombre del lugar de procedencia, distrito y provincia.</p>
            <button onClick={() => { onSetShowAddProc(true); onSetNewProcData({}); onSetAdminError(null); }} className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[12px] font-medium px-3 py-1.5 rounded border border-emerald-200"><Plus className="h-4 w-4" /> Agregar</button>
          </div>
        </div>

        {showAddProc && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold">Agregar Procedencia</h4>
                <button onClick={() => { onSetShowAddProc(false); onSetNewProcErrors({}); }} className="text-zinc-500"><X className="h-5 w-5" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px]">Nombre</label>
                  <input className="w-full border px-2 py-1 text-xs rounded" value={newProcData.nombre ?? ''} onChange={e => onSetNewProcData({ ...newProcData, nombre: e.target.value })} />
                  {newProcErrors.nombre && <div className="text-red-600 text-xs mt-1">{newProcErrors.nombre}</div>}
                </div>
                <div>
                  <label className="text-[12px]">Distrito</label>
                  <input className="w-full border px-2 py-1 text-xs rounded" value={newProcData.distrito ?? ''} onChange={e => onSetNewProcData({ ...newProcData, distrito: e.target.value })} />
                </div>
                <div>
                  <label className="text-[12px]">Provincia</label>
                  <input className="w-full border px-2 py-1 text-xs rounded" value={newProcData.provincia ?? ''} onChange={e => onSetNewProcData({ ...newProcData, provincia: e.target.value })} />
                </div>
                <div>
                  <label className="text-[12px]">Departamento</label>
                  <input className="w-full border px-2 py-1 text-xs rounded" value={newProcData.departamento ?? ''} onChange={e => onSetNewProcData({ ...newProcData, departamento: e.target.value })} />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={onCreateProc} disabled={adminSaving} className="bg-emerald-900 text-white px-4 py-2 rounded">Guardar</button>
                <button onClick={() => { onSetShowAddProc(false); onSetNewProcData({}); onSetNewProcErrors({}); }} className="bg-zinc-100 px-4 py-2 rounded">Cancelar</button>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-zinc-50 text-zinc-500 uppercase text-[10px] font-semibold tracking-wider border-b border-zinc-200">
                <th className="p-3 text-left">Nombre</th>
                <th className="p-3 text-left">Distrito</th>
                <th className="p-3 text-left">Provincia</th>
                <th className="p-3 text-left">Departamento</th>
                <th className="p-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {procedencias.map(proc => (
                <tr key={proc.id} className={`transition ${editingProcId === proc.id ? 'bg-zinc-50/80' : 'hover:bg-zinc-50/40'}`}>
                  {editingProcId === proc.id ? (
                    <>
                      <td className="p-2"><input className="w-40 border border-zinc-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400" value={editingProcData.nombre ?? proc.nombre} onChange={e => onSetEditingProcData({ ...editingProcData, nombre: e.target.value })} /></td>
                      <td className="p-2"><input className="w-32 border border-zinc-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400" value={editingProcData.distrito ?? proc.distrito ?? ''} onChange={e => onSetEditingProcData({ ...editingProcData, distrito: e.target.value })} /></td>
                      <td className="p-2"><input className="w-32 border border-zinc-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400" value={editingProcData.provincia ?? proc.provincia ?? ''} onChange={e => onSetEditingProcData({ ...editingProcData, provincia: e.target.value })} /></td>
                      <td className="p-2"><input className="w-32 border border-zinc-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400" value={editingProcData.departamento ?? proc.departamento ?? ''} onChange={e => onSetEditingProcData({ ...editingProcData, departamento: e.target.value })} /></td>
                      <td className="p-2"><div className="flex gap-1.5"><button onClick={() => onSaveProc(proc.id)} disabled={adminSaving} className="flex items-center gap-1 bg-zinc-900 hover:bg-zinc-700 text-zinc-50 text-[10px] font-medium px-2.5 py-1.5 rounded transition disabled:opacity-50"><Save className="h-3 w-3" /> Guardar</button><button onClick={() => { onSetEditingProcId(null); onSetEditingProcData({}); }} className="flex items-center gap-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[10px] font-medium px-2 py-1.5 rounded border border-zinc-200 transition"><X className="h-3 w-3" /></button></div></td>
                    </>
                  ) : (
                    <>
                      <td className="p-3 font-medium text-zinc-900">{proc.nombre}</td>
                      <td className="p-3 text-zinc-600">{proc.distrito || <span className="text-zinc-300">—</span>}</td>
                      <td className="p-3 text-zinc-600">{proc.provincia || <span className="text-zinc-300">—</span>}</td>
                      <td className="p-3 text-zinc-600">{proc.departamento || <span className="text-zinc-300">—</span>}</td>
                      <td className="p-3"><div className="flex gap-1.5"><button onClick={() => { onSetEditingProcId(proc.id); onSetEditingProcData({}); onSetAdminError(null); }} className="flex items-center gap-1 text-[10px] font-medium text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 px-2 py-1.5 rounded transition"><Pencil className="h-3 w-3" /> Editar</button><button onClick={() => onDeleteProc(proc.id)} className="flex items-center gap-1 text-[10px] font-medium text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2 py-1.5 rounded transition"><Trash2 className="h-3 w-3" /></button></div></td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
