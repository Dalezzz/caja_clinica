import React, { useEffect, useState } from 'react';
import {
  Building,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  DollarSign,
  User,
  Phone,
  X,
  AlertCircle,
} from 'lucide-react';
import api, { AlquilerEspacio } from '../api';

export function AlquileresPanel() {
  const [alquileres, setAlquileres] = useState<AlquilerEspacio[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    nombre: '',
    fechaInicio: '',
    fechaFin: '',
    precioTotal: '',
    arrendatario: '',
    contacto: '',
    observaciones: '',
  });

  const today = new Date().toISOString().split('T')[0];

  const cargar = async () => {
    setLoading(true);
    try {
      const data = await api.obtenerAlquileres();
      setAlquileres(data);
    } catch {
      setError('No se pudo cargar los alquileres. Verifica la conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const mostrar = (msg: string, isError = false) => {
    if (isError) { setError(msg); setTimeout(() => setError(null), 4000); }
    else { setSuccess(msg); setTimeout(() => setSuccess(null), 3500); }
  };

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre || !form.fechaInicio || !form.fechaFin || !form.precioTotal || !form.arrendatario) {
      mostrar('Completa todos los campos requeridos.', true);
      return;
    }
    setSaving(true);
    try {
      const nuevo = await api.crearAlquiler({
        nombre: form.nombre,
        fechaInicio: form.fechaInicio,
        fechaFin: form.fechaFin,
        precioTotal: Number(form.precioTotal),
        arrendatario: form.arrendatario,
        contacto: form.contacto || undefined,
        observaciones: form.observaciones || undefined,
      });
      setAlquileres((prev) => [nuevo, ...prev]);
      setShowModal(false);
      setForm({ nombre: '', fechaInicio: '', fechaFin: '', precioTotal: '', arrendatario: '', contacto: '', observaciones: '' });
      mostrar('Alquiler creado correctamente.');
    } catch { mostrar('No se pudo crear el alquiler.', true); }
    finally { setSaving(false); }
  };

  const handleFinalizar = async (id: number) => {
    if (!window.confirm('¿Marcar este alquiler como finalizado?')) return;
    try {
      const updated = await api.finalizarAlquiler(id);
      setAlquileres((prev) => prev.map((a) => (a.id === id ? updated : a)));
      mostrar('Alquiler finalizado correctamente.');
    } catch { mostrar('No se pudo finalizar el alquiler.', true); }
  };

  const handleCancelar = async (id: number) => {
    if (!window.confirm('¿Cancelar este alquiler? Se revertirá el ingreso de caja.')) return;
    try {
      const updated = await api.cancelarAlquiler(id);
      setAlquileres((prev) => prev.map((a) => (a.id === id ? updated : a)));
      mostrar('Alquiler cancelado y monto revertido en caja.');
    } catch { mostrar('No se pudo cancelar el alquiler.', true); }
  };

  const filtrados = filtroEstado ? alquileres.filter((a) => a.estado === filtroEstado) : alquileres;
  const totalIngresos = alquileres.filter((a) => a.estado !== 'CANCELADO').reduce((s, a) => s + Number(a.precioTotal), 0);

  const estadoBadge = (estado: string) => {
    const map: Record<string, string> = {
      ACTIVO: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      FINALIZADO: 'bg-zinc-100 text-zinc-600 border border-zinc-200',
      CANCELADO: 'bg-red-50 text-red-600 border border-red-200',
    };
    return map[estado] || '';
  };

  const estadoIcon = (estado: string) => {
    if (estado === 'ACTIVO') return <Clock className="h-3 w-3" />;
    if (estado === 'FINALIZADO') return <CheckCircle className="h-3 w-3" />;
    return <XCircle className="h-3 w-3" />;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="white-card rounded-lg p-5 border border-zinc-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
              <Building className="h-4 w-4 text-zinc-700" />
              Alquileres de Espacios
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">Control de alquileres de consultorio, quirófano y otros espacios</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold px-4 py-2 rounded-md flex items-center gap-1.5 transition"
          >
            <Plus className="h-3.5 w-3.5" /> Nuevo Alquiler
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {[
            { label: 'Total alquileres', value: alquileres.length, color: 'text-zinc-900' },
            { label: 'Activos', value: alquileres.filter((a) => a.estado === 'ACTIVO').length, color: 'text-emerald-700' },
            { label: 'Finalizados', value: alquileres.filter((a) => a.estado === 'FINALIZADO').length, color: 'text-zinc-500' },
            { label: 'Ingresos totales', value: `S/ ${totalIngresos.toFixed(2)}`, color: 'text-emerald-700' },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-zinc-50 border border-zinc-200 rounded-md p-3 text-center">
              <div className={`text-base font-bold ${kpi.color}`}>{kpi.value}</div>
              <div className="text-[10px] text-zinc-500 font-medium mt-0.5">{kpi.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2.5 rounded-md">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-4 py-2.5 rounded-md">
          <CheckCircle className="h-3.5 w-3.5 shrink-0" /> {success}
        </div>
      )}

      {/* Filtros */}
      <div className="white-card rounded-lg p-4 border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Filtrar por estado:</span>
          {['', 'ACTIVO', 'FINALIZADO', 'CANCELADO'].map((est) => (
            <button
              key={est}
              onClick={() => setFiltroEstado(est)}
              className={`text-xs px-3 py-1 rounded-full border font-medium transition ${
                filtroEstado === est ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'
              }`}
            >
              {est || 'Todos'}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="white-card rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-zinc-100 rounded-md animate-pulse" />
            ))}
          </div>
        ) : filtrados.length === 0 ? (
          <div className="p-12 text-center text-zinc-400">
            <Building className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No hay alquileres registrados</p>
            <p className="text-xs mt-1">Crea el primer alquiler usando el botón superior</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  {['Espacio / Campaña', 'Arrendatario', 'Período', 'Precio', 'Estado', 'Acciones'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-zinc-500 uppercase tracking-wider text-[10px]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtrados.map((alq) => (
                  <tr key={alq.id} className="hover:bg-zinc-50 transition">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-zinc-900">{alq.nombre}</div>
                      {alq.observaciones && <div className="text-zinc-400 text-[10px]">{alq.observaciones}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-zinc-700">
                        <User className="h-3 w-3 text-zinc-400" />
                        {alq.arrendatario}
                      </div>
                      {alq.contacto && (
                        <div className="flex items-center gap-1 text-zinc-400 text-[10px] mt-0.5">
                          <Phone className="h-2.5 w-2.5" /> {alq.contacto}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-zinc-400" />
                        {new Date(alq.fechaInicio).toLocaleDateString('es-PE')}
                      </div>
                      <div className="text-zinc-400 text-[10px]">
                        hasta {new Date(alq.fechaFin).toLocaleDateString('es-PE')}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-zinc-900 font-semibold">
                        <DollarSign className="h-3 w-3 text-zinc-400" />
                        S/ {Number(alq.precioTotal).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${estadoBadge(alq.estado)}`}>
                        {estadoIcon(alq.estado)}
                        {alq.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {alq.estado === 'ACTIVO' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleFinalizar(alq.id)}
                            className="text-[10px] font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md hover:bg-emerald-100 transition"
                          >
                            Finalizar
                          </button>
                          <button
                            onClick={() => handleCancelar(alq.id)}
                            className="text-[10px] font-semibold px-2.5 py-1 bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 transition"
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                      {alq.estado !== 'ACTIVO' && <span className="text-zinc-300 text-[10px]">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear Alquiler */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl border border-zinc-200 w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                <Building className="h-4 w-4" /> Nuevo Alquiler de Espacio
              </h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-700 transition">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCrear} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                    Nombre del Espacio *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Consultorio A, Quirófano 1..."
                    value={form.nombre}
                    onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                    className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Fecha Inicio *</label>
                  <input
                    type="date"
                    value={form.fechaInicio}
                    defaultValue={today}
                    onChange={(e) => setForm((f) => ({ ...f, fechaInicio: e.target.value }))}
                    className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-xs text-zinc-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Fecha Fin *</label>
                  <input
                    type="date"
                    value={form.fechaFin}
                    onChange={(e) => setForm((f) => ({ ...f, fechaFin: e.target.value }))}
                    className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-xs text-zinc-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Precio Total (S/) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.precioTotal}
                    onChange={(e) => setForm((f) => ({ ...f, precioTotal: e.target.value }))}
                    className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-xs text-zinc-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Arrendatario *</label>
                  <input
                    type="text"
                    placeholder="Nombre o empresa"
                    value={form.arrendatario}
                    onChange={(e) => setForm((f) => ({ ...f, arrendatario: e.target.value }))}
                    className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-xs text-zinc-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Contacto</label>
                  <input
                    type="text"
                    placeholder="+51 ..."
                    value={form.contacto}
                    onChange={(e) => setForm((f) => ({ ...f, contacto: e.target.value }))}
                    className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-xs text-zinc-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Observaciones</label>
                  <textarea
                    rows={2}
                    placeholder="Notas adicionales..."
                    value={form.observaciones}
                    onChange={(e) => setForm((f) => ({ ...f, observaciones: e.target.value }))}
                    className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 text-xs font-semibold px-4 py-2 bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-md hover:bg-zinc-200 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 text-xs font-semibold px-4 py-2 bg-zinc-900 text-white rounded-md hover:bg-zinc-800 transition disabled:opacity-60"
                >
                  {saving ? 'Guardando...' : 'Crear Alquiler'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
