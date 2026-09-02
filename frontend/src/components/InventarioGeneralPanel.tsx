import { useState, useEffect } from "react";
import {
  Boxes,
  Building2,
  Search,
  Plus,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  Upload,
  RefreshCw,
} from "lucide-react";
import api from "../api";

interface Ubicacion {
  id: number;
  nombre: string;
  tipo: string;
  piso?: string;
  descripcion?: string;
  especialidad?: string;
  medico?: { id: number; nombre: string; especialidad: string };
  _count?: { activos: number };
}

interface CategoriaActivo {
  id: number;
  nombre: string;
}

interface ActivoFijo {
  id: number;
  codigoPatrimonial?: string;
  nombre: string;
  descripcion?: string;
  categoria: CategoriaActivo;
  ubicacion: Ubicacion;
  cantidad: number;
  estado: "OPERATIVO" | "EN_MANTENIMIENTO" | "MALOGRADO" | "DE_BAJA";
  observaciones?: string;
}

interface Estadisticas {
  totalUbicaciones: number;
  totalRegistrosActivos: number;
  totalUnidadesActivos: number;
  porEstado: Array<{ estado: string; cantidad: number; registros: number }>;
}

export function InventarioGeneralPanel() {
  const [activeTab, setActiveTab] = useState<"censo" | "activos" | "importar">("censo");
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [activos, setActivos] = useState<ActivoFijo[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [selectedUbicacion, setSelectedUbicacion] = useState<Ubicacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("");
  const [filterEstado, setFilterEstado] = useState<string>("");

  // Modales
  const [showAddActivoModal, setShowAddActivoModal] = useState(false);
  const [showTrasladoModal, setShowTrasladoModal] = useState(false);
  const [selectedActivo, setSelectedActivo] = useState<ActivoFijo | null>(null);

  // Form Activo
  const [formActivo, setFormActivo] = useState({
    nombre: "",
    codigoPatrimonial: "",
    categoriaNombre: "Mobiliario",
    ubicacionId: 0,
    cantidad: 1,
    estado: "OPERATIVO",
    observaciones: "",
  });

  // Form Traslado
  const [formTraslado, setFormTraslado] = useState({
    nuevaUbicacionId: 0,
    cantidadATrasladar: 1,
    motivo: "",
  });

  // Upload Excel
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [alreadyImportedWarning, setAlreadyImportedWarning] = useState<string | null>(null);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resUbicaciones, resActivos, resEstadisticas] = await Promise.all([
        api.getUbicaciones(),
        api.getActivosFijos(),
        api.getEstadisticasInventario(),
      ]);

      if (Array.isArray(resUbicaciones)) {
        setUbicaciones(resUbicaciones);
        if (resUbicaciones.length > 0 && !selectedUbicacion) {
          setSelectedUbicacion(resUbicaciones[0]);
        }
      }
      if (Array.isArray(resActivos)) setActivos(resActivos);
      if (resEstadisticas && typeof resEstadisticas === "object") setEstadisticas(resEstadisticas);
    } catch (err) {
      console.error("Error cargando inventario general:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleCrearActivo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formActivo.nombre || !formActivo.ubicacionId) {
      alert("Por favor ingresa el nombre del activo y selecciona una ubicación.");
      return;
    }

    try {
      await api.crearActivoFijo(formActivo);
      alert("Activo registrado correctamente");
      setShowAddActivoModal(false);
      setFormActivo({
        nombre: "",
        codigoPatrimonial: "",
        categoriaNombre: "Mobiliario",
        ubicacionId: 0,
        cantidad: 1,
        estado: "OPERATIVO",
        observaciones: "",
      });
      cargarDatos();
    } catch (err: any) {
      alert(`Error al registrar activo: ${err.message || "Fallo en servidor"}`);
    }
  };

  const handleTrasladar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivo || !formTraslado.nuevaUbicacionId) {
      alert("Selecciona la nueva ubicación.");
      return;
    }

    try {
      await api.trasladarActivoFijo(selectedActivo.id, formTraslado);
      alert("Traslado registrado exitosamente");
      setShowTrasladoModal(false);
      setSelectedActivo(null);
      cargarDatos();
    } catch (err: any) {
      alert(`Error ejecutando traslado: ${err.message || "Fallo en servidor"}`);
    }
  };

  const handleUploadExcel = async (force: boolean = false) => {
    if (!uploadFile) {
      alert("Por favor selecciona un archivo Excel (.xlsx)");
      return;
    }

    setUploading(true);
    setUploadMessage(null);
    setAlreadyImportedWarning(null);

    try {
      const data = await api.importarInventarioGeneralExcel(uploadFile, force);

      if (data.yaImportado) {
        setAlreadyImportedWarning(data.mensaje);
      } else {
        setUploadMessage(
          `✅ Excel procesado con éxito. Ubicaciones creadas: ${data.resumen?.ubicacionesCreadas || 0}, Activos procesados: ${data.resumen?.activosCreados || 0}`
        );
        cargarDatos();
      }
    } catch (err: any) {
      setUploadMessage(`❌ Error: ${err.message || "Fallo la importación"}`);
    } finally {
      setUploading(false);
    }
  };

  const ubicacionesFiltradas = ubicaciones.filter((ub) => {
    const matchSearch =
      ub.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (ub.especialidad && ub.especialidad.toLowerCase().includes(search.toLowerCase()));
    const matchTipo = !filterTipo || ub.tipo === filterTipo;
    return matchSearch && matchTipo;
  });

  const activosFiltrados = activos.filter((act) => {
    const matchSearch =
      act.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (act.codigoPatrimonial && act.codigoPatrimonial.toLowerCase().includes(search.toLowerCase())) ||
      act.ubicacion?.nombre.toLowerCase().includes(search.toLowerCase());
    const matchEstado = !filterEstado || act.estado === filterEstado;
    return matchSearch && matchEstado;
  });

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="h-6 w-6 text-emerald-600" />
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
              Control Patrimonial e Inventario General de la Clínica
            </h1>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Censo de activos fijos, mobiliario, equipamiento médico y distribución por habitaciones y áreas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setFormActivo((prev) => ({ ...prev, ubicacionId: ubicaciones[0]?.id || 0 }));
              setShowAddActivoModal(true);
            }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all"
          >
            <Plus className="h-4 w-4" /> Registrar Nuevo Activo
          </button>
          <button
            onClick={cargarDatos}
            className="p-2.5 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-100 transition-colors"
            title="Recargar datos"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-zinc-500 font-medium">Ubicaciones / Habitaciones</div>
            <div className="text-2xl font-bold text-zinc-900">
              {estadisticas?.totalUbicaciones || ubicaciones.length}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-sky-50 rounded-xl text-sky-600">
            <Boxes className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-zinc-500 font-medium">Total Activos Fijos</div>
            <div className="text-2xl font-bold text-zinc-900">
              {estadisticas?.totalUnidadesActivos || activos.reduce((acc, a) => acc + a.cantidad, 0)}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-zinc-500 font-medium">Operativos</div>
            <div className="text-2xl font-bold text-emerald-600">
              {activos.filter((a) => a.estado === "OPERATIVO").reduce((acc, a) => acc + a.cantidad, 0)}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-zinc-500 font-medium">En Mantenimiento / Malogrado</div>
            <div className="text-2xl font-bold text-amber-600">
              {activos.filter((a) => a.estado !== "OPERATIVO").reduce((acc, a) => acc + a.cantidad, 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200 flex items-center gap-4">
        <button
          onClick={() => setActiveTab("censo")}
          className={`pb-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === "censo"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
          }`}
        >
          Censo por Ubicación ({ubicaciones.length})
        </button>
        <button
          onClick={() => setActiveTab("activos")}
          className={`pb-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === "activos"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
          }`}
        >
          Buscador Global de Activos ({activos.length})
        </button>
        <button
          onClick={() => setActiveTab("importar")}
          className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "importar"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <Upload className="h-3.5 w-3.5" /> Cargar Excel Inventario
        </button>
      </div>

      {/* Search & Filters */}
      {activeTab !== "importar" && (
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder={
                activeTab === "censo"
                  ? "Buscar por nombre de habitación, SOP, consultorio..."
                  : "Buscar activo por nombre, código patrimonial o ubicación..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {activeTab === "censo" ? (
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="px-3 py-2 border border-zinc-200 rounded-xl text-xs text-zinc-700 bg-white"
            >
              <option value="">Todas las Áreas</option>
              <option value="HABITACION">Habitaciones</option>
              <option value="SOP">Quirófanos (SOP)</option>
              <option value="CONSULTORIO">Consultorios</option>
              <option value="ESTAR_ENFERMERIA">Estar de Enfermería</option>
              <option value="ALMACEN">Almacenes</option>
              <option value="SERVICIOS_GENERALES">Cocina & Lavandería</option>
              <option value="AREA_COMUN">Áreas Comunes</option>
            </select>
          ) : (
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="px-3 py-2 border border-zinc-200 rounded-xl text-xs text-zinc-700 bg-white"
            >
              <option value="">Todos los Estados</option>
              <option value="OPERATIVO">Operativo</option>
              <option value="EN_MANTENIMIENTO">En Mantenimiento</option>
              <option value="MALOGRADO">Malogrado</option>
              <option value="DE_BAJA">De Baja</option>
            </select>
          )}
        </div>
      )}

      {/* Tab content 1: Censo por Ubicación */}
      {activeTab === "censo" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Lista de Ubicaciones */}
          <div className="md:col-span-1 space-y-2 max-h-[650px] overflow-y-auto pr-1">
            {ubicacionesFiltradas.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-zinc-200 text-xs text-zinc-400">
                No se encontraron ubicaciones.
              </div>
            ) : (
              ubicacionesFiltradas.map((ub) => {
                const isSelected = selectedUbicacion?.id === ub.id;
                return (
                  <div
                    key={ub.id}
                    onClick={() => setSelectedUbicacion(ub)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-emerald-50/80 border-emerald-500 shadow-sm"
                        : "bg-white border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-xs text-zinc-900">{ub.nombre}</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
                        {ub._count?.activos || 0} bienes
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-1 flex items-center justify-between">
                      <span>{ub.tipo}</span>
                      {ub.especialidad && (
                        <span className="text-emerald-700 font-semibold">{ub.especialidad}</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Detalle de Activos en la Ubicación Seleccionada */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm min-h-[500px]">
            {selectedUbicacion ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-zinc-900">{selectedUbicacion.nombre}</h2>
                    <p className="text-xs text-zinc-500">
                      Tipo: <span className="font-semibold">{selectedUbicacion.tipo}</span>{" "}
                      {selectedUbicacion.especialidad && ` | Especialidad: ${selectedUbicacion.especialidad}`}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setFormActivo((prev) => ({ ...prev, ubicacionId: selectedUbicacion.id }));
                      setShowAddActivoModal(true);
                    }}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg"
                  >
                    <Plus className="h-3.5 w-3.5" /> Agregar Bien a esta área
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50/50 text-zinc-500 font-bold">
                        <th className="py-2.5 px-3">Categoría</th>
                        <th className="py-2.5 px-3">Artículo / Bien</th>
                        <th className="py-2.5 px-3 text-center">Cant.</th>
                        <th className="py-2.5 px-3">Estado</th>
                        <th className="py-2.5 px-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {activos
                        .filter((a) => a.ubicacion?.id === selectedUbicacion.id)
                        .map((act) => (
                          <tr key={act.id} className="hover:bg-zinc-50/60">
                            <td className="py-2.5 px-3 font-medium text-zinc-600">
                              {act.categoria?.nombre || "General"}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-zinc-900">
                              {act.nombre}
                              {act.codigoPatrimonial && (
                                <span className="block text-[10px] text-zinc-400 font-mono">
                                  Cod: {act.codigoPatrimonial}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-zinc-800">
                              {act.cantidad}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  act.estado === "OPERATIVO"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : act.estado === "MALOGRADO"
                                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                                    : "bg-amber-50 text-amber-700 border border-amber-200"
                                }`}
                              >
                                {act.estado}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => {
                                  setSelectedActivo(act);
                                  setShowTrasladoModal(true);
                                }}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200"
                              >
                                <ArrowRightLeft className="h-3 w-3" /> Trasladar
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-16 text-zinc-400">
                <Building2 className="h-10 w-10 stroke-[1.5] mb-2 text-zinc-300" />
                <p className="text-xs font-semibold">Selecciona una ubicación a la izquierda para ver su inventario.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab content 2: Buscador Global de Activos */}
      {activeTab === "activos" && (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 font-bold text-zinc-600">
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Bien / Artículo</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4">Ubicación Física</th>
                  <th className="py-3 px-4 text-center">Cantidad</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {activosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-zinc-400">
                      No se encontraron activos fijos.
                    </td>
                  </tr>
                ) : (
                  activosFiltrados.map((act) => (
                    <tr key={act.id} className="hover:bg-zinc-50">
                      <td className="py-3 px-4 font-mono text-[11px] text-zinc-500">
                        {act.codigoPatrimonial || "-"}
                      </td>
                      <td className="py-3 px-4 font-bold text-zinc-900">{act.nombre}</td>
                      <td className="py-3 px-4 text-zinc-600">{act.categoria?.nombre || "General"}</td>
                      <td className="py-3 px-4 font-semibold text-emerald-800">
                        {act.ubicacion?.nombre}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-zinc-900">{act.cantidad}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            act.estado === "OPERATIVO"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : act.estado === "MALOGRADO"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {act.estado}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedActivo(act);
                            setShowTrasladoModal(true);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200"
                        >
                          <ArrowRightLeft className="h-3 w-3" /> Mover
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab content 3: Cargar Excel */}
      {activeTab === "importar" && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 max-w-xl mx-auto space-y-4 shadow-sm">
          <div>
            <h3 className="font-bold text-base text-zinc-900">Importador Directo de Censo Excel</h3>
            <p className="text-xs text-zinc-500 mt-1">
              Sube el archivo <span className="font-semibold text-zinc-800">INVENTARIO AGOSTO.xlsx</span> para sembrar automáticamente las 11 pestañas de áreas, habitaciones, quirófanos y fármacos.
            </p>
          </div>

          <div className="border-2 border-dashed border-zinc-200 rounded-xl p-6 text-center space-y-3">
            <Upload className="h-8 w-8 text-zinc-400 mx-auto" />
            <input
              type="file"
              accept=".xlsx"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="block w-full text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
            />
            {uploadFile && (
              <p className="text-xs font-semibold text-emerald-600">Archivo seleccionado: {uploadFile.name}</p>
            )}
          </div>

          <button
            onClick={() => handleUploadExcel(false)}
            disabled={!uploadFile || uploading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2"
          >
            {uploading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? "Procesando Excel de la Clínica..." : "Ejecutar Importación Masiva"}
          </button>

          {alreadyImportedWarning && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
              <p className="text-xs font-semibold text-amber-900">{alreadyImportedWarning}</p>
              <button
                type="button"
                onClick={() => handleUploadExcel(true)}
                disabled={uploading}
                className="bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm"
              >
                Forzar Re-Sincronización
              </button>
            </div>
          )}

          {uploadMessage && (
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-800">
              {uploadMessage}
            </div>
          )}
        </div>
      )}

      {/* Modal Registrar Activo */}
      {showAddActivoModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-base text-zinc-900">Registrar Bien / Activo Fijo</h3>

            <form onSubmit={handleCrearActivo} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1 text-zinc-700">Nombre del Bien / Equipo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Camilla con almohada, Monitor, TV 42"
                  value={formActivo.nombre}
                  onChange={(e) => setFormActivo({ ...formActivo, nombre: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl border-zinc-200 outline-none"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-zinc-700">Ubicación / Habitación / Área</label>
                <select
                  value={formActivo.ubicacionId}
                  onChange={(e) => setFormActivo({ ...formActivo, ubicacionId: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-xl border-zinc-200 bg-white"
                >
                  {ubicaciones.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre} ({u.tipo})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1 text-zinc-700">Categoría</label>
                  <input
                    type="text"
                    placeholder="Mobiliario, Equipamiento médico"
                    value={formActivo.categoriaNombre}
                    onChange={(e) => setFormActivo({ ...formActivo, categoriaNombre: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl border-zinc-200 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-zinc-700">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    value={formActivo.cantidad}
                    onChange={(e) => setFormActivo({ ...formActivo, cantidad: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border rounded-xl border-zinc-200 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-zinc-700">Estado del Bien</label>
                <select
                  value={formActivo.estado}
                  onChange={(e) => setFormActivo({ ...formActivo, estado: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl border-zinc-200 bg-white"
                >
                  <option value="OPERATIVO">OPERATIVO</option>
                  <option value="EN_MANTENIMIENTO">EN MANTENIMIENTO</option>
                  <option value="MALOGRADO">MALOGRADO</option>
                  <option value="DE_BAJA">DE BAJA</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddActivoModal(false)}
                  className="px-4 py-2 rounded-xl text-zinc-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700"
                >
                  Guardar Bien
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Traslado */}
      {showTrasladoModal && selectedActivo && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-base text-zinc-900">Trasladar Activo Fijo</h3>

            <div className="p-3 bg-zinc-50 rounded-xl border text-xs">
              <span className="font-bold text-zinc-900">{selectedActivo.nombre}</span>
              <span className="block text-zinc-500">
                Ubicación actual: {selectedActivo.ubicacion?.nombre} (Total disponible: {selectedActivo.cantidad})
              </span>
            </div>

            <form onSubmit={handleTrasladar} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1 text-zinc-700">Nueva Ubicación Destino</label>
                <select
                  value={formTraslado.nuevaUbicacionId}
                  onChange={(e) => setFormTraslado({ ...formTraslado, nuevaUbicacionId: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-xl border-zinc-200 bg-white"
                >
                  <option value={0}>-- Selecciona Destino --</option>
                  {ubicaciones.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre} ({u.tipo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-zinc-700">
                  Cantidad a Trasladar (Max: {selectedActivo.cantidad})
                </label>
                <input
                  type="number"
                  min={1}
                  max={selectedActivo.cantidad}
                  value={formTraslado.cantidadATrasladar}
                  onChange={(e) =>
                    setFormTraslado({
                      ...formTraslado,
                      cantidadATrasladar: Math.min(
                        selectedActivo.cantidad,
                        Math.max(1, parseInt(e.target.value) || 1)
                      ),
                    })
                  }
                  className="w-full px-3 py-2 border rounded-xl border-zinc-200 outline-none font-bold text-zinc-900"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-zinc-700">Motivo del Traslado</label>
                <input
                  type="text"
                  placeholder="Ej: Cambio de habitación por mantenimiento, solicitud médica"
                  value={formTraslado.motivo}
                  onChange={(e) => setFormTraslado({ ...formTraslado, motivo: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl border-zinc-200 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTrasladoModal(false)}
                  className="px-4 py-2 rounded-xl text-zinc-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700"
                >
                  Confirmar Traslado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
