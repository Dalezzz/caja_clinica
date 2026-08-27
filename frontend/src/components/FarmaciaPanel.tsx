import React, { useState, useEffect, useCallback, useRef } from "react";
import api, { Producto, ProductoConKardex } from "../api";
import {
  Pill,
  Plus,
  Upload,
  Search,
  X,
  TrendingUp,
  TrendingDown,
  Sliders,
  AlertCircle,
  CheckCircle,
  Package,
  History,
  AlertTriangle,
  FileSpreadsheet,
  RefreshCw,
  Layers,
} from "lucide-react";

// ── Badge de Stock Estilizado ────────────────────────────────────────────────
function StockBadge({ stock, unidad }: { stock: number; unidad: string }) {
  const num = Number(stock);
  if (num <= 0) {
    return (
      <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1">
        <AlertTriangle className="h-3 w-3 text-red-600" /> Sin stock
      </span>
    );
  }
  if (num <= 10) {
    return (
      <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1">
        <AlertCircle className="h-3 w-3 text-amber-600" /> {num.toLocaleString("es-PE")} {unidad} (Bajo)
      </span>
    );
  }
  return (
    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1">
      <CheckCircle className="h-3 w-3 text-emerald-600" /> {num.toLocaleString("es-PE")} {unidad}
    </span>
  );
}

// ── Modal Kardex Detallado ───────────────────────────────────────────────────
function KardexModal({
  producto,
  onClose,
  onMovimiento,
}: {
  producto: ProductoConKardex;
  onClose: () => void;
  onMovimiento: () => void;
}) {
  const [tipo, setTipo] = useState<"ENTRADA" | "SALIDA" | "AJUSTE">("ENTRADA");
  const [cantidad, setCantidad] = useState("");
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRegistrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cantidad || Number(cantidad) <= 0) {
      setError("La cantidad debe ser mayor a 0");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await api.registrarMovimientoKardex({
        productoId: producto.id,
        tipo,
        cantidad: Number(cantidad),
        motivo: motivo.trim() || undefined,
      });
      setSuccess("Movimiento registrado correctamente en el Kardex");
      setCantidad("");
      setMotivo("");
      onMovimiento();
      setTimeout(() => setSuccess(null), 3500);
    } catch (err: any) {
      setError(err.message || "Error al registrar movimiento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-zinc-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-100 bg-zinc-50/50">
          <div>
            <div className="flex items-center gap-2">
              <Pill className="h-4 w-4 text-zinc-900" />
              <h3 className="text-sm font-semibold text-zinc-900">{producto.nombre}</h3>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-zinc-100 text-zinc-700 border border-zinc-200 text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider">
                {producto.categoria}
              </span>
              <StockBadge stock={Number(producto.stockActual)} unidad={producto.unidadMedida} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 transition p-1 rounded-md hover:bg-zinc-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5">
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

          {/* Formulario Registrar Movimiento */}
          <form onSubmit={handleRegistrar} className="bg-zinc-50/70 border border-zinc-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-200/60 pb-2">
              <h4 className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-zinc-600" /> Registrar Nuevo Movimiento
              </h4>
              <span className="text-[10px] text-zinc-500 font-medium">Recálculo automático en servidor</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-3">
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                  Tipo
                </label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as any)}
                  className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs font-semibold text-zinc-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                >
                  <option value="ENTRADA">🟢 ENTRADA (+)</option>
                  <option value="SALIDA">🔴 SALIDA (-)</option>
                  <option value="AJUSTE">🟡 AJUSTE (=)</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                  Cantidad ({producto.unidadMedida})
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  required
                  placeholder="0.00"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                  Motivo / Detalle
                </label>
                <input
                  type="text"
                  placeholder="Ej. Compra Factura F001..."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="h-8 w-full bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs rounded-md shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {loading ? "Guardando..." : "Registrar"}
                </button>
              </div>
            </div>
          </form>

          {/* Historial Kardex */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                <History className="h-3.5 w-3.5 text-zinc-600" /> Historial de Movimientos de Kardex
              </h4>
              <span className="text-[11px] text-zinc-500 font-medium">
                {producto.movimientos.length} registros
              </span>
            </div>

            <div className="overflow-x-auto border border-zinc-200 rounded-lg max-h-72">
              {producto.movimientos.length === 0 ? (
                <div className="text-center py-10 text-zinc-400 text-xs bg-white">
                  No hay movimientos registrados para este producto.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-zinc-50 text-zinc-500 uppercase font-semibold text-[10px] tracking-wider border-b border-zinc-200">
                    <tr>
                      <th className="p-2.5">Fecha & Hora</th>
                      <th className="p-2.5">Tipo</th>
                      <th className="p-2.5 text-right">Cantidad</th>
                      <th className="p-2.5 text-right">Saldo Resultante</th>
                      <th className="p-2.5">Motivo / Ticket</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 bg-white">
                    {producto.movimientos.map((m) => {
                      const isSalida = m.tipo === "SALIDA";
                      const isEntrada = m.tipo === "ENTRADA";
                      return (
                        <tr key={m.id} className="hover:bg-zinc-50/60 transition-colors">
                          <td className="p-2.5 text-zinc-600 whitespace-nowrap text-[11px]">
                            {new Date(m.fecha).toLocaleString("es-PE", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="p-2.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider inline-flex items-center gap-1 ${
                                isEntrada
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : isSalida
                                  ? "bg-red-50 text-red-700 border border-red-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {isEntrada && <TrendingUp className="h-3 w-3" />}
                              {isSalida && <TrendingDown className="h-3 w-3" />}
                              {m.tipo}
                            </span>
                          </td>
                          <td
                            className={`p-2.5 text-right font-semibold whitespace-nowrap ${
                              isEntrada
                                ? "text-emerald-700"
                                : isSalida
                                ? "text-red-600"
                                : "text-amber-700"
                            }`}
                          >
                            {isSalida ? "-" : isEntrada ? "+" : ""}
                            {Number(m.cantidad).toLocaleString("es-PE")} {producto.unidadMedida}
                          </td>
                          <td className="p-2.5 text-right font-bold text-zinc-900 whitespace-nowrap">
                            {Number(m.saldoResultante).toLocaleString("es-PE")} {producto.unidadMedida}
                          </td>
                          <td className="p-2.5 text-zinc-600 text-[11px]">
                            {m.motivo || "—"}
                            {m.ticketId && (
                              <span className="ml-1.5 bg-zinc-100 text-zinc-700 border border-zinc-200 text-[9px] font-semibold px-1.5 py-0.5 rounded">
                                Ticket #{m.ticketId}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex justify-end">
          <button
            onClick={onClose}
            className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold border border-zinc-200 rounded-md px-4 py-1.5 text-xs transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Nuevo Producto ──────────────────────────────────────────────────────
function NuevoProductoModal({
  onClose,
  onCreado,
  categorias,
}: {
  onClose: () => void;
  onCreado: () => void;
  categorias: string[];
}) {
  const [form, setForm] = useState({
    nombre: "",
    detalle: "",
    categoria: categorias[0] || "",
    nuevaCategoria: "",
    stockActual: "",
    unidadMedida: "UND",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unidades = ["UND", "ML", "MG", "GR", "CAJA", "FRASCO", "AMPOLLA", "BLISTER", "SOBRE"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setError("El nombre del producto es obligatorio.");
      return;
    }
    const cat = form.nuevaCategoria.trim() || form.categoria;
    if (!cat) {
      setError("La categoría es obligatoria.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.createProducto({
        nombre: form.nombre.trim(),
        detalle: form.detalle.trim() || undefined,
        categoria: cat.toUpperCase(),
        stockActual: Number(form.stockActual) || 0,
        unidadMedida: form.unidadMedida,
        activo: true,
      });
      onCreado();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al crear el producto.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-zinc-200 w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-zinc-100 bg-zinc-50/50">
          <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
            <Package className="h-4 w-4 text-zinc-900" /> Nuevo Producto Farmacéutico
          </h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 transition p-1 rounded-md hover:bg-zinc-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2 rounded-md">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Nombre del Producto *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Paracetamol 500mg, Amoxicilina..."
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Detalle / Presentación
            </label>
            <input
              type="text"
              placeholder="Ej. Caja x 100 tabletas, Frasco 120ml..."
              value={form.detalle}
              onChange={(e) => setForm({ ...form, detalle: e.target.value })}
              className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                Categoría
              </label>
              <select
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-xs text-zinc-800 font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
              >
                {categorias.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="">+ Nueva categoría</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                Unidad de Medida
              </label>
              <select
                value={form.unidadMedida}
                onChange={(e) => setForm({ ...form, unidadMedida: e.target.value })}
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-xs text-zinc-800 font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
              >
                {unidades.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(form.categoria === "" || !categorias.includes(form.categoria)) && (
            <div>
              <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                Nombre de Nueva Categoría *
              </label>
              <input
                type="text"
                placeholder="Ej. ANALGÉSICOS, ANTIBIÓTICOS..."
                value={form.nuevaCategoria}
                onChange={(e) => setForm({ ...form, nuevaCategoria: e.target.value })}
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Stock Inicial
            </label>
            <input
              type="number"
              min="0"
              step="0.001"
              placeholder="0.00"
              value={form.stockActual}
              onChange={(e) => setForm({ ...form, stockActual: e.target.value })}
              className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-xs text-zinc-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold border border-zinc-200 rounded-md px-4 py-2 text-xs transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-zinc-900 hover:bg-zinc-800 text-white font-semibold px-4 py-2 rounded-md text-xs transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
            >
              {loading ? "Guardando..." : "Crear Producto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal Importar Excel ──────────────────────────────────────────────────────
function ImportarExcelModal({
  onClose,
  onImportado,
}: {
  onClose: () => void;
  onImportado: () => void;
}) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [contexto, setContexto] = useState<"clinica" | "farmacia">("farmacia");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    importados: number;
    productos: number;
    errores: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith(".xlsx") || f.name.endsWith(".xls"))) setArchivo(f);
  };

  const handleImportar = async () => {
    if (!archivo) {
      setError("Selecciona un archivo Excel (.xlsx o .xls)");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await api.importarExcelFarmacia(archivo, contexto);
      setResult(r);
      onImportado();
    } catch (err: any) {
      setError(err.message || "Error al procesar e importar el archivo Excel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-zinc-200 w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-zinc-100 bg-zinc-50/50">
          <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-zinc-900" /> Importación Masiva de Kardex Excel
          </h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 transition p-1 rounded-md hover:bg-zinc-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2.5 rounded-md">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
            </div>
          )}

          {/* Dropzone estilo ImporterPanel */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center space-y-2 cursor-pointer transition ${
              archivo
                ? "border-emerald-400 bg-emerald-50/40"
                : "border-zinc-300 hover:border-zinc-500 bg-zinc-50/40"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx, .xls"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && setArchivo(e.target.files[0])}
            />
            <Upload className={`h-8 w-8 mx-auto ${archivo ? "text-emerald-600" : "text-zinc-400"}`} />
            <div>
              {archivo ? (
                <div>
                  <p className="text-xs font-semibold text-emerald-800">{archivo.name}</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    {(archivo.size / 1024).toFixed(1)} KB • Listo para importar
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-semibold text-zinc-900">
                    Arrastre su archivo Excel de Kardex histórico (.xlsx, .xls)
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    o haga clic aquí para seleccionar desde su equipo
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Contexto de Importación
            </label>
            <select
              value={contexto}
              onChange={(e) => setContexto(e.target.value as any)}
              className="h-9 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-xs text-zinc-800 font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
            >
              <option value="farmacia">Farmacia (Medicamentos / Fármacos)</option>
              <option value="clinica">Clínica (Insumos Médicos / Descartables)</option>
            </select>
          </div>

          {result && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 text-xs font-semibold">
                <CheckCircle className="h-4 w-4 text-emerald-600" /> Importación exitosa y transaccional
              </div>
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-white p-2 rounded border border-emerald-100">
                  <div className="text-[10px] text-zinc-500 uppercase">Productos Creados</div>
                  <div className="text-sm font-bold text-zinc-900">{result.productos}</div>
                </div>
                <div className="bg-white p-2 rounded border border-emerald-100">
                  <div className="text-[10px] text-zinc-500 uppercase">Movimientos Kardex</div>
                  <div className="text-sm font-bold text-emerald-700">{result.importados}</div>
                </div>
              </div>
              {result.errores.length > 0 && (
                <details className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 mt-2">
                  <summary className="cursor-pointer font-medium">
                    {result.errores.length} observaciones menores
                  </summary>
                  <ul className="list-disc pl-4 mt-1 space-y-0.5 max-h-24 overflow-y-auto">
                    {result.errores.slice(0, 15).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold border border-zinc-200 rounded-md px-4 py-2 text-xs transition"
            >
              {result ? "Terminar" : "Cancelar"}
            </button>
            <button
              type="button"
              onClick={handleImportar}
              disabled={loading || !archivo}
              className="bg-zinc-900 hover:bg-zinc-800 text-white font-semibold px-4 py-2 rounded-md text-xs transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Procesando...
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" /> Iniciar Inyección Masiva
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Panel Principal de Farmacia ───────────────────────────────────────────────
export default function FarmaciaPanel() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [loading, setLoading] = useState(true);
  const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoConKardex | null>(null);
  const [showNuevoProducto, setShowNuevoProducto] = useState(false);
  const [showImportar, setShowImportar] = useState(false);
  const [loadingKardex, setLoadingKardex] = useState(false);

  const cargarProductos = useCallback(async () => {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        api.getProductos(busqueda || undefined, categoriaFiltro || undefined),
        api.getCategoriasFarmacia(),
      ]);
      setProductos(prods);
      setCategorias(cats);
    } catch (e) {
      console.error("Error cargando productos de farmacia", e);
    } finally {
      setLoading(false);
    }
  }, [busqueda, categoriaFiltro]);

  useEffect(() => {
    const t = setTimeout(cargarProductos, 250);
    return () => clearTimeout(t);
  }, [cargarProductos]);

  const handleVerKardex = async (producto: Producto) => {
    setLoadingKardex(true);
    try {
      const detalle = await api.getProductoById(producto.id);
      setProductoSeleccionado(detalle);
    } catch (e) {
      console.error("Error cargando detalle Kardex", e);
    } finally {
      setLoadingKardex(false);
    }
  };

  const handleMovimientoRegistrado = async () => {
    if (!productoSeleccionado) return;
    const detalle = await api.getProductoById(productoSeleccionado.id);
    setProductoSeleccionado(detalle);
    cargarProductos();
  };

  // KPIs
  const totalProductos = productos.length;
  const sinStock = productos.filter((p) => Number(p.stockActual) <= 0).length;
  const stockBajo = productos.filter((p) => Number(p.stockActual) > 0 && Number(p.stockActual) <= 10).length;
  const stockOptimo = productos.filter((p) => Number(p.stockActual) > 10).length;

  return (
    <div className="space-y-5">
      {/* Header Card con KPIs unificados */}
      <div className="white-card rounded-lg p-5 border border-zinc-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
              <Pill className="h-4 w-4 text-zinc-900" />
              Módulo de Farmacia & Kardex
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Control de inventario, stock en tiempo real, movimientos históricos y carga masiva
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImportar(true)}
              className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold px-3.5 py-2 rounded-md border border-zinc-200 flex items-center gap-1.5 transition shadow-sm"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-zinc-600" /> Importar Excel
            </button>
            <button
              onClick={() => setShowNuevoProducto(true)}
              className="bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold px-4 py-2 rounded-md flex items-center gap-1.5 transition shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" /> Nuevo Producto
            </button>
          </div>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {[
            {
              label: "Total Productos",
              value: totalProductos,
              color: "text-zinc-900",
            },
            {
              label: "En Stock Óptimo",
              value: stockOptimo,
              color: "text-emerald-700",
            },
            {
              label: "Stock Bajo (≤ 10)",
              value: stockBajo,
              color: "text-amber-600",
            },
            {
              label: "Sin Stock (Agotado)",
              value: sinStock,
              color: sinStock > 0 ? "text-red-600" : "text-zinc-400",
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="bg-zinc-50 border border-zinc-200 rounded-md p-3 text-center"
            >
              <div className={`text-base font-bold ${kpi.color}`}>{kpi.value}</div>
              <div className="text-[10px] text-zinc-500 font-medium mt-0.5 uppercase tracking-wider">
                {kpi.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="white-card rounded-lg p-4 border border-zinc-200 shadow-sm">
        <div className="bg-zinc-50/50 p-3 border border-zinc-200 rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Buscar Medicamento / Insumo
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por nombre o presentación..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="h-8 w-full rounded-md border border-zinc-200 bg-white pl-8 pr-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Filtrar por Categoría
            </label>
            <select
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-800 font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
            >
              <option value="">-- Todas las Categorías --</option>
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de Productos */}
      <div className="white-card rounded-lg p-5 border border-zinc-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-zinc-700" />
            <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
              Inventario de Farmacia
            </h3>
          </div>
          <span className="text-xs text-zinc-500 font-medium">
            {productos.length} productos listados
          </span>
        </div>

        <div className="overflow-x-auto border border-zinc-200 rounded-lg">
          {loading ? (
            <div className="text-center py-12 text-zinc-400 text-xs bg-white flex flex-col items-center justify-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin text-zinc-500" />
              <span>Cargando inventario de productos...</span>
            </div>
          ) : productos.length === 0 ? (
            <div className="text-center py-14 text-zinc-400 text-xs bg-white space-y-2">
              <Package className="h-8 w-8 text-zinc-300 mx-auto" />
              <p className="font-semibold text-zinc-700 text-xs">No se encontraron productos registrados</p>
              <p className="text-[11px] text-zinc-400">
                Cree un nuevo producto o utilice el importador masivo de Excel.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-zinc-50 text-zinc-500 uppercase font-semibold text-[10px] tracking-wider border-b border-zinc-200">
                  <th className="p-3">Nombre del Producto</th>
                  <th className="p-3">Categoría</th>
                  <th className="p-3">Unidad</th>
                  <th className="p-3">Stock Actual</th>
                  <th className="p-3">Movimientos</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white">
                {productos.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="p-3">
                      <div className="font-semibold text-zinc-900">{p.nombre}</div>
                      {p.detalle && <div className="text-[11px] text-zinc-500 mt-0.5">{p.detalle}</div>}
                    </td>
                    <td className="p-3">
                      <span className="bg-zinc-100 text-zinc-700 border border-zinc-200 text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider">
                        {p.categoria}
                      </span>
                    </td>
                    <td className="p-3 text-zinc-600 font-medium">{p.unidadMedida}</td>
                    <td className="p-3">
                      <StockBadge stock={Number(p.stockActual)} unidad={p.unidadMedida} />
                    </td>
                    <td className="p-3 text-zinc-600 font-medium">
                      {p._count?.movimientos ?? 0} registros
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleVerKardex(p)}
                        disabled={loadingKardex}
                        className="bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold px-3 py-1.5 rounded-md inline-flex items-center gap-1.5 transition shadow-sm"
                      >
                        <History className="h-3.5 w-3.5" /> Ver Kardex
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modales */}
      {productoSeleccionado && (
        <KardexModal
          producto={productoSeleccionado}
          onClose={() => setProductoSeleccionado(null)}
          onMovimiento={handleMovimientoRegistrado}
        />
      )}

      {showNuevoProducto && (
        <NuevoProductoModal
          onClose={() => setShowNuevoProducto(false)}
          onCreado={cargarProductos}
          categorias={categorias}
        />
      )}

      {showImportar && (
        <ImportarExcelModal
          onClose={() => setShowImportar(false)}
          onImportado={cargarProductos}
        />
      )}
    </div>
  );
}
