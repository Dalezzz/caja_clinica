import { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Award,
  RefreshCw,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import api, { EstadisticaMedicoMensual, Medico, RankingMedicos } from "../api";

interface EstadisticasPanelProps {
  medicos: Medico[];
}

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function EstadisticasPanel({ medicos }: EstadisticasPanelProps) {
  const ahora = new Date();
  const [mes, setMes] = useState(ahora.getMonth() + 1);
  const [anio, setAnio] = useState(ahora.getFullYear());
  const [ranking, setRanking] = useState<RankingMedicos[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticaMedicoMensual[]>(
    [],
  );
  const [medicoAnualId, setMedicoAnualId] = useState<number>(
    medicos[0]?.id || 0,
  );
  const [comparativaAnual, setComparativaAnual] = useState<any[]>([]);
  const [crecimiento, setCrecimiento] = useState<{
    mesPasado: number;
    mesActual: number;
    crecimiento: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingAnual, setLoadingAnual] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarMensual = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rank, stats] = await Promise.all([
        api.obtenerRankingMedicos(mes, anio),
        api.obtenerEstadisticaMensual(mes, anio),
      ]);
      setRanking(rank);
      setEstadisticas(stats);
    } catch {
      setError(
        "No se pudieron cargar las estadísticas. Verifica que haya datos para el período seleccionado.",
      );
    } finally {
      setLoading(false);
    }
  };

  const cargarAnual = async () => {
    if (!medicoAnualId) return;
    setLoadingAnual(true);
    try {
      const [anual, crec] = await Promise.all([
        api.obtenerComparativaAnual(medicoAnualId, anio),
        api.obtenerCrecimientoMedico(medicoAnualId, mes, anio),
      ]);
      setComparativaAnual(anual);
      setCrecimiento(crec);
    } catch {
      setComparativaAnual([]);
      setCrecimiento(null);
    } finally {
      setLoadingAnual(false);
    }
  };

  useEffect(() => {
    cargarMensual();
  }, [mes, anio]);
  useEffect(() => {
    cargarAnual();
  }, [medicoAnualId, mes, anio]);

  const medalColor = (puesto: number) => {
    if (puesto === 1) return "bg-amber-50 border-amber-300 text-amber-700";
    if (puesto === 2) return "bg-zinc-100 border-zinc-300 text-zinc-600";
    if (puesto === 3) return "bg-orange-50 border-orange-200 text-orange-700";
    return "bg-white border-zinc-200 text-zinc-500";
  };

  const medalLabel = (puesto: number) => {
    if (puesto === 1) return "🥇";
    if (puesto === 2) return "🥈";
    if (puesto === 3) return "🥉";
    return `#${puesto}`;
  };

  const maxAnual =
    comparativaAnual.length > 0
      ? Math.max(
        ...comparativaAnual.map((d: any) => Number(d.montoPaciente || 0)),
      )
      : 1;

  const totalMes = estadisticas.reduce(
    (s, e) => s + Number(e.montoPaciente),
    0,
  );

  const anioOptions = Array.from(
    { length: 5 },
    (_, i) => ahora.getFullYear() - i,
  );

  return (
    <div className="space-y-5">
      {/* Header & Filtros */}
      <div className="white-card rounded-lg p-5 border border-zinc-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-zinc-700" />
              Estadísticas de Médicos
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Análisis de rendimiento y generación de ingresos por médico
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
              className="h-9 rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-semibold text-zinc-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
            >
              {MESES.map((m, i) => (
                <option key={i + 1} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
              className="h-9 rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-semibold text-zinc-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
            >
              {anioOptions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <button
              onClick={cargarMensual}
              disabled={loading}
              className="h-9 w-9 flex items-center justify-center border border-zinc-200 rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* KPI Total */}
        <div className="mt-4 bg-zinc-50 border border-zinc-200 rounded-md px-4 py-2.5 flex items-center justify-between">
          <span className="text-xs text-zinc-500 font-medium">
            Total generado en {MESES[mes - 1]} {anio}
          </span>
          <span className="text-sm font-bold text-zinc-900">
            S/ {totalMes.toFixed(2)}
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs px-4 py-2.5 rounded-md">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Ranking */}
        <div className="white-card rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-zinc-50 border-b border-zinc-200 flex items-center gap-2">
            <Award className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
              Ranking del Mes
            </span>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-14 bg-zinc-100 rounded-md animate-pulse"
                />
              ))}
            </div>
          ) : ranking.length === 0 ? (
            <div className="p-10 text-center text-zinc-400 text-xs">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-30" />
              Sin datos para el período seleccionado
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {ranking.map((r) => (
                <div
                  key={r.medicoId}
                  className={`flex items-center gap-3 px-5 py-3 transition hover:bg-zinc-50 border-l-2 ${r.puesto === 1
                      ? "border-amber-400"
                      : r.puesto === 2
                        ? "border-zinc-400"
                        : r.puesto === 3
                          ? "border-orange-400"
                          : "border-transparent"
                    }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center text-sm font-bold shrink-0 ${medalColor(r.puesto)}`}
                  >
                    {medalLabel(r.puesto)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-zinc-900 truncate">
                      {r.nombreMedico}
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      {r.especialidad} · {r.servicios} servicios
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-zinc-900">
                      S/ {Number(r.montoPaciente).toFixed(0)}
                    </div>
                    <div className="text-[10px] text-emerald-600 font-medium">
                      Com: S/ {Number(r.montoMedico).toFixed(0)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tabla estadísticas */}
        <div className="white-card rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-zinc-50 border-b border-zinc-200 flex items-center gap-2">
            <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
              Detalle por Médico
            </span>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-10 bg-zinc-100 rounded-md animate-pulse"
                />
              ))}
            </div>
          ) : estadisticas.length === 0 ? (
            <div className="p-10 text-center text-zinc-400 text-xs">
              Sin datos
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead className="border-b border-zinc-200">
                  <tr>
                    <th className="px-4 py-2 text-left text-[10px] font-semibold text-zinc-500 uppercase">
                      Médico
                    </th>
                    <th className="px-3 py-2 text-right text-[10px] font-semibold text-zinc-500 uppercase">
                      Serv.
                    </th>
                    <th className="px-3 py-2 text-right text-[10px] font-semibold text-zinc-500 uppercase">
                      Total
                    </th>
                    <th className="px-3 py-2 text-right text-[10px] font-semibold text-zinc-500 uppercase">
                      Com. Méd.
                    </th>
                    <th className="px-3 py-2 text-right text-[10px] font-semibold text-zinc-500 uppercase">
                      %
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {estadisticas.map((est) => (
                    <tr
                      key={est.medicoId}
                      className="hover:bg-zinc-50 transition"
                    >
                      <td className="px-4 py-2.5 font-medium text-zinc-900 truncate max-w-[150px]">
                        {est.nombreMedico}
                      </td>
                      <td className="px-3 py-2.5 text-right text-zinc-600">
                        {est.totalServicios}
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold text-zinc-800">
                        S/ {Number(est.montoPaciente).toFixed(0)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold text-emerald-700">
                        S/ {Number(est.montoMedico).toFixed(0)}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <div className="w-16 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-zinc-800 rounded-full"
                              style={{
                                width: `${Math.min(100, Number(est.porcentajeGeneral))}%`,
                              }}
                            />
                          </div>
                          <span className="text-zinc-500">
                            {Number(est.porcentajeGeneral).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Gráfico Comparativa Anual */}
      <div className="white-card rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-zinc-50 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
              Comparativa Anual por Médico — {anio}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {crecimiento && (
              <div
                className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${crecimiento.crecimiento >= 0
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-red-50 text-red-600 border-red-200"
                  }`}
              >
                {crecimiento.crecimiento >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {crecimiento.crecimiento >= 0 ? "+" : ""}
                {Number(crecimiento.crecimiento).toFixed(1)}% vs mes anterior
              </div>
            )}
            <select
              value={medicoAnualId}
              onChange={(e) => setMedicoAnualId(Number(e.target.value))}
              className="h-8 rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-semibold text-zinc-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
            >
              {medicos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-6">
          {loadingAnual ? (
            <div className="h-56 bg-zinc-100 rounded-lg animate-pulse" />
          ) : comparativaAnual.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-zinc-400 text-xs">
              <BarChart3 className="h-8 w-8 mb-2 opacity-30" />
              No hay datos anuales registrados para este médico en {anio}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Leyenda y resumen anual */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-zinc-50 border border-zinc-200/80 rounded-lg p-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-sm bg-zinc-900 inline-block" />
                    <span className="text-zinc-600 font-medium text-[11px]">
                      Total Generado (Paciente)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-sm bg-emerald-600 inline-block" />
                    <span className="text-zinc-600 font-medium text-[11px]">
                      Honorario Médico
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-sm border-2 border-zinc-950 bg-amber-400 inline-block" />
                    <span className="text-zinc-600 font-medium text-[11px]">
                      Mes Seleccionado
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4 font-semibold text-zinc-800 text-[11px]">
                  <span>
                    Acumulado Anual:{" "}
                    <strong className="text-zinc-950 text-xs">
                      S/{" "}
                      {comparativaAnual
                        .reduce(
                          (s: number, d: any) =>
                            s + Number(d.montoPaciente || 0),
                          0,
                        )
                        .toFixed(2)}
                    </strong>
                  </span>
                  <span>
                    Honorarios:{" "}
                    <strong className="text-emerald-700 text-xs">
                      S/{" "}
                      {comparativaAnual
                        .reduce(
                          (s: number, d: any) => s + Number(d.montoMedico || 0),
                          0,
                        )
                        .toFixed(2)}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Área del Gráfico con Grid Lines */}
              <div className="relative pt-6 pb-2">
                {/* Guías horizontales de fondo */}
                <div className="absolute inset-x-0 top-6 bottom-10 flex flex-col justify-between pointer-events-none opacity-40">
                  <div className="border-b border-dashed border-zinc-300 w-full flex justify-end">
                    <span className="text-[9px] text-zinc-400 font-mono -mt-3 bg-white px-1">
                      S/ {maxAnual.toFixed(0)}
                    </span>
                  </div>
                  <div className="border-b border-dashed border-zinc-200 w-full flex justify-end">
                    <span className="text-[9px] text-zinc-400 font-mono -mt-3 bg-white px-1">
                      S/ {(maxAnual * 0.5).toFixed(0)}
                    </span>
                  </div>
                  <div className="border-b border-zinc-300 w-full flex justify-end">
                    <span className="text-[9px] text-zinc-400 font-mono -mt-3 bg-white px-1">
                      S/ 0
                    </span>
                  </div>
                </div>

                {/* Columnas de Barras */}
                <div className="flex items-end gap-2 sm:gap-3 h-52 pb-1 relative z-10 px-2">
                  {MESES.map((_nombreMes, idx) => {
                    const dato = comparativaAnual.find(
                      (d: any) => d.mes === idx + 1,
                    );
                    const valorTotal = dato
                      ? Number(dato.montoPaciente || 0)
                      : 0;
                    const valorMedico = dato
                      ? Number(dato.montoMedico || 0)
                      : 0;
                    const servicios = dato
                      ? Number(dato.totalServicios || 0)
                      : 0;

                    const pctTotal =
                      maxAnual > 0 ? (valorTotal / maxAnual) * 100 : 0;
                    const esMesActual = idx + 1 === mes;
                    const tieneDatos = valorTotal > 0;

                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center justify-end h-full group relative"
                      >
                        {/* Tooltip flotante enriquecido al hacer hover */}
                        {tieneDatos && (
                          <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 bg-zinc-950 text-white text-[10px] p-2.5 rounded-lg shadow-xl whitespace-nowrap pointer-events-none z-30 transition-all duration-150 transform translate-y-1 group-hover:translate-y-0 border border-zinc-800">
                            <div className="font-bold border-b border-zinc-800 pb-1 mb-1 text-zinc-200">
                              {MESES[idx]} {anio}
                            </div>
                            <div className="space-y-0.5 text-[10px]">
                              <div className="flex justify-between gap-3 text-zinc-400">
                                <span>Atenciones:</span>
                                <strong className="text-white">
                                  {servicios}
                                </strong>
                              </div>
                              <div className="flex justify-between gap-3 text-zinc-400">
                                <span>Facturado:</span>
                                <strong className="text-white font-mono">
                                  S/ {valorTotal.toFixed(2)}
                                </strong>
                              </div>
                              <div className="flex justify-between gap-3 text-emerald-400">
                                <span>Comisión Dr.:</span>
                                <strong className="font-mono">
                                  S/ {valorMedico.toFixed(2)}
                                </strong>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Etiqueta de valor sobre la barra */}
                        <div className="mb-1 text-[9px] font-semibold text-zinc-700 truncate max-w-full text-center transition-opacity">
                          {tieneDatos
                            ? `S/${valorTotal >= 1000 ? `${(valorTotal / 1000).toFixed(1)}k` : valorTotal.toFixed(0)}`
                            : ""}
                        </div>

                        {/* Contenedor de la Barra con sombreado y animación */}
                        <div
                          className={`w-full max-w-[32px] rounded-t-md transition-all duration-300 relative flex flex-col justify-end overflow-hidden ${esMesActual
                              ? "ring-2 ring-zinc-950 ring-offset-1 shadow-md"
                              : "hover:opacity-90"
                            } ${tieneDatos ? "bg-zinc-800 shadow-sm" : "bg-zinc-100"
                            }`}
                          style={{
                            height: `${Math.max(pctTotal, tieneDatos ? 8 : 2)}%`,
                            minHeight: tieneDatos ? "14px" : "4px",
                          }}
                        >
                          {/* Sub-barra de comisión médica interior */}
                          {tieneDatos && valorTotal > 0 && (
                            <div
                              className="w-full bg-emerald-500/90 transition-all"
                              style={{
                                height: `${Math.min(100, (valorMedico / valorTotal) * 100)}%`,
                              }}
                              title={`Comisión: S/ ${valorMedico}`}
                            />
                          )}
                        </div>

                        {/* Indicador de mes actual activo */}
                        {esMesActual && (
                          <span className="h-1.5 w-1.5 rounded-full bg-zinc-950 mt-1.5 absolute -bottom-5" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Eje X: Etiquetas de meses */}
                <div className="flex gap-2 sm:gap-3 border-t border-zinc-300 pt-2 px-2">
                  {MESES.map((m, i) => (
                    <div
                      key={i}
                      className={`flex-1 text-center text-[10px] font-semibold transition-colors ${i + 1 === mes
                          ? "text-zinc-950 font-bold underline underline-offset-4 decoration-2"
                          : "text-zinc-500 hover:text-zinc-800"
                        }`}
                    >
                      {m.slice(0, 3)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
