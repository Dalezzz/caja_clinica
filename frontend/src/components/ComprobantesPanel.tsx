import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FileText,
  Download,
  PenLine,
  Trash2,
  Plus,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import api, { ComprobantePagoMedico, Medico } from '../api';

interface ComprobantesPanelProps {
  medicos: Medico[];
}

export function ComprobantesPanel({ medicos }: ComprobantesPanelProps) {
  const [comprobantes, setComprobantes] = useState<ComprobantePagoMedico[]>([]);
  const [loading, setLoading] = useState(true);
  const [medicoSeleccionado, setMedicoSeleccionado] = useState<number>(medicos[0]?.id || 0);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showFirmador, setShowFirmador] = useState<number | null>(null);
  const [generando, setGenerando] = useState(false);
  const [firmando, setFirmando] = useState(false);
  const [descargando, setDescargando] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Canvas firmador
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  const mostrar = (msg: string, isError = false) => {
    if (isError) { setError(msg); setTimeout(() => setError(null), 5000); }
    else { setSuccess(msg); setTimeout(() => setSuccess(null), 4000); }
  };

  const cargar = useCallback(async () => {
    if (!medicoSeleccionado) return;
    setLoading(true);
    try {
      const data = await api.obtenerComprobantesPorMedico(medicoSeleccionado);
      setComprobantes(data);
    } catch {
      mostrar('No se pudieron cargar los comprobantes.', true);
    } finally {
      setLoading(false);
    }
  }, [medicoSeleccionado]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleGenerarDia = async () => {
    if (!medicoSeleccionado) return;
    setGenerando(true);
    try {
      const nuevo = await api.generarComprobanteDia(medicoSeleccionado);
      setComprobantes((prev) => [nuevo, ...prev]);
      mostrar('Comprobante del día generado correctamente.');
    } catch (err: any) {
      mostrar(err?.message || 'Error al generar el comprobante. Verifica que haya tickets del médico hoy.', true);
    } finally {
      setGenerando(false);
    }
  };

  const handleCancelar = async (id: number) => {
    if (!window.confirm('¿Cancelar este comprobante?')) return;
    try {
      const updated = await api.cancelarComprobante(id);
      setComprobantes((prev) => prev.map((c) => (c.id === id ? updated : c)));
      mostrar('Comprobante cancelado.');
    } catch { mostrar('No se pudo cancelar el comprobante.', true); }
  };

  const handleDescargarPDF = async (id: number) => {
    setDescargando(id);
    try {
      const blob = await api.descargarComprobantePDF(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comprobante_${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      mostrar('PDF descargado correctamente.');
    } catch { mostrar('No se pudo descargar el PDF.', true); }
    finally { setDescargando(null); }
  };

  // Canvas drawing
  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    isDrawing.current = true;
    const ctx = canvasRef.current!.getContext('2d')!;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const ctx = canvasRef.current!.getContext('2d')!;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#18181b';
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDraw = () => { isDrawing.current = false; };

  const limpiarCanvas = () => {
    const canvas = canvasRef.current!;
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleFirmar = async (id: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const isEmpty = !imageData.data.some((v, i) => i % 4 === 3 && v > 0);
    if (isEmpty) { mostrar('Dibuja la firma antes de confirmar.', true); return; }

    setFirmando(true);
    try {
      const firmaBase64 = canvas.toDataURL('image/png');
      const updated = await api.firmarComprobante(id, firmaBase64);
      setComprobantes((prev) => prev.map((c) => (c.id === id ? updated : c)));
      setShowFirmador(null);
      mostrar('Comprobante firmado y PDF generado correctamente. Ya puedes descargarlo.');
    } catch { mostrar('Error al firmar. Intenta de nuevo.', true); }
    finally { setFirmando(false); }
  };

  const estadoBadge = (estado: string) => {
    const map: Record<string, string> = {
      BORRADOR: 'bg-amber-50 text-amber-700 border border-amber-200',
      FIRMADO: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      CANCELADO: 'bg-red-50 text-red-600 border border-red-200',
    };
    return map[estado] || '';
  };

  const estadoIcon = (estado: string) => {
    if (estado === 'BORRADOR') return <Clock className="h-3 w-3" />;
    if (estado === 'FIRMADO') return <CheckCircle className="h-3 w-3" />;
    return <Trash2 className="h-3 w-3" />;
  };

  const medicoActual = medicos.find((m) => m.id === medicoSeleccionado);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="white-card rounded-lg p-5 border border-zinc-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-zinc-700" />
              Comprobantes de Pago Médico
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">Genera, firma digitalmente y descarga PDF de honorarios</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={medicoSeleccionado}
              onChange={(e) => setMedicoSeleccionado(Number(e.target.value))}
              className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
            >
              {medicos.map((m) => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
            <button
              onClick={cargar}
              className="h-9 w-9 flex items-center justify-center border border-zinc-200 rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition"
              title="Recargar"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleGenerarDia}
              disabled={generando}
              className="h-9 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold px-4 rounded-md flex items-center gap-1.5 transition disabled:opacity-60"
            >
              <Plus className="h-3.5 w-3.5" />
              {generando ? 'Generando...' : 'Generar Hoy'}
            </button>
          </div>
        </div>

        {medicoActual && (
          <div className="mt-3 bg-zinc-50 border border-zinc-200 rounded-md px-3 py-2 text-xs text-zinc-600 flex items-center gap-4">
            <span className="font-semibold text-zinc-900">{medicoActual.nombre}</span>
            <span>{medicoActual.especialidad}</span>
            {medicoActual.cmp && <span className="text-zinc-400">CMP: {medicoActual.cmp}</span>}
          </div>
        )}
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

      {/* Lista de comprobantes */}
      <div className="white-card rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-zinc-100 rounded-md animate-pulse" />
            ))}
          </div>
        ) : comprobantes.length === 0 ? (
          <div className="p-12 text-center text-zinc-400">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No hay comprobantes para este médico</p>
            <p className="text-xs mt-1">Usa el botón "Generar Hoy" para crear el comprobante del día</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {comprobantes.map((comp) => (
              <div key={comp.id} className="p-4 hover:bg-zinc-50 transition">
                {/* Fila principal */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-zinc-900 text-xs">
                        Comprobante #{comp.id}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${estadoBadge(comp.estado)}`}>
                        {estadoIcon(comp.estado)} {comp.estado}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-zinc-500 flex items-center gap-3 flex-wrap">
                      <span>
                        Período: {new Date(comp.periodoInicio).toLocaleDateString('es-PE')} — {new Date(comp.periodoFin).toLocaleDateString('es-PE')}
                      </span>
                      <span className="font-semibold text-zinc-700">{comp.cantidadServicios} servicios</span>
                      <span className="font-bold text-zinc-900">S/ {Number(comp.montoNeto).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {comp.estado === 'BORRADOR' && (
                      <button
                        onClick={() => { setShowFirmador(comp.id); limpiarCanvas(); }}
                        className="text-[10px] font-semibold px-2.5 py-1.5 bg-zinc-900 text-white rounded-md hover:bg-zinc-800 transition flex items-center gap-1"
                      >
                        <PenLine className="h-3 w-3" /> Firmar
                      </button>
                    )}
                    {comp.estado === 'FIRMADO' && comp.documentoPdfPath && (
                      <button
                        onClick={() => handleDescargarPDF(comp.id)}
                        disabled={descargando === comp.id}
                        className="text-[10px] font-semibold px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md hover:bg-emerald-100 transition flex items-center gap-1 disabled:opacity-60"
                      >
                        <Download className="h-3 w-3" /> {descargando === comp.id ? '...' : 'PDF'}
                      </button>
                    )}
                    {comp.estado === 'BORRADOR' && (
                      <button
                        onClick={() => handleCancelar(comp.id)}
                        className="text-[10px] font-semibold px-2 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 transition"
                        title="Cancelar comprobante"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedId(expandedId === comp.id ? null : comp.id)}
                      className="text-[10px] px-2 py-1.5 bg-zinc-100 text-zinc-500 border border-zinc-200 rounded-md hover:bg-zinc-200 transition"
                    >
                      {expandedId === comp.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                  </div>
                </div>

                {/* Detalle expandido */}
                {expandedId === comp.id && (
                  <div className="mt-3 bg-zinc-50 rounded-md border border-zinc-200 overflow-hidden">
                    <div className="px-4 py-2 bg-zinc-100 border-b border-zinc-200">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Detalle de Servicios</span>
                    </div>
                    {comp.tickets && comp.tickets.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-[11px]">
                          <thead>
                            <tr className="border-b border-zinc-200">
                              <th className="px-4 py-2 text-left font-semibold text-zinc-500">Ticket</th>
                              <th className="px-4 py-2 text-left font-semibold text-zinc-500">Paciente</th>
                              <th className="px-4 py-2 text-left font-semibold text-zinc-500">Tarifa</th>
                              <th className="px-4 py-2 text-right font-semibold text-zinc-500">Monto</th>
                              <th className="px-4 py-2 text-right font-semibold text-zinc-500">Comisión</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100">
                            {comp.tickets.map((tk) => (
                              <tr key={tk.id} className="hover:bg-white transition">
                                <td className="px-4 py-2 font-mono text-zinc-600">{tk.numeroTicket}</td>
                                <td className="px-4 py-2 text-zinc-800">{tk.paciente}</td>
                                <td className="px-4 py-2 text-zinc-600">{tk.tarifa}</td>
                                <td className="px-4 py-2 text-right text-zinc-800">S/ {Number(tk.monto).toFixed(2)}</td>
                                <td className="px-4 py-2 text-right font-semibold text-emerald-700">S/ {Number(tk.comisionMedico).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="px-4 py-2 bg-zinc-50 border-t border-zinc-200 flex justify-end gap-6 text-xs">
                          <span className="text-zinc-500">Total servicios: <span className="font-semibold text-zinc-800">S/ {Number(comp.montoTotal).toFixed(2)}</span></span>
                          {Number(comp.montoDescuento) > 0 && (
                            <span className="text-zinc-500">Descuento: <span className="font-semibold text-red-600">-S/ {Number(comp.montoDescuento).toFixed(2)}</span></span>
                          )}
                          <span className="text-zinc-900 font-bold">Neto: S/ {Number(comp.montoNeto).toFixed(2)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-zinc-400 text-xs">No hay detalle de tickets disponible</div>
                    )}
                  </div>
                )}

                {/* Firmador digital modal */}
                {showFirmador === comp.id && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl border border-zinc-200 w-full max-w-lg mx-4">
                      <div className="flex items-center justify-between p-5 border-b border-zinc-100">
                        <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                          <PenLine className="h-4 w-4" /> Firma Digital del Médico
                        </h3>
                        <button onClick={() => setShowFirmador(null)} className="text-zinc-400 hover:text-zinc-700 transition">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="p-5 space-y-4">
                        <p className="text-xs text-zinc-500">
                          Dibuja tu firma con el mouse o dedo. Al confirmar, se generará el PDF del comprobante automáticamente.
                        </p>
                        <div className="border-2 border-dashed border-zinc-300 rounded-lg overflow-hidden bg-zinc-50 relative">
                          <canvas
                            ref={canvasRef}
                            width={460}
                            height={160}
                            className="w-full cursor-crosshair touch-none block"
                            style={{ maxHeight: 160 }}
                            onMouseDown={startDraw}
                            onMouseMove={draw}
                            onMouseUp={endDraw}
                            onMouseLeave={endDraw}
                            onTouchStart={startDraw}
                            onTouchMove={draw}
                            onTouchEnd={endDraw}
                          />
                          <div className="absolute bottom-2 left-3 text-[10px] text-zinc-400 pointer-events-none select-none">
                            Firma aquí ↑
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={limpiarCanvas}
                            className="flex-1 text-xs font-semibold px-4 py-2 bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-md hover:bg-zinc-200 transition"
                          >
                            Limpiar
                          </button>
                          <button
                            type="button"
                            disabled={firmando}
                            onClick={() => handleFirmar(comp.id)}
                            className="flex-1 text-xs font-semibold px-4 py-2 bg-zinc-900 text-white rounded-md hover:bg-zinc-800 transition disabled:opacity-60 flex items-center justify-center gap-2"
                          >
                            {firmando ? (
                              <><RefreshCw className="h-3 w-3 animate-spin" /> Procesando...</>
                            ) : (
                              <><CheckCircle className="h-3 w-3" /> Confirmar Firma & Generar PDF</>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
