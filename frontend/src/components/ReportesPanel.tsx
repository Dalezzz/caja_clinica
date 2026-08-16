import { useState } from 'react';
import {
  MessageCircle,
  Send,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Info,
} from 'lucide-react';
import api from '../api';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

interface EnvioRecord {
  id: number;
  tipo: 'dia' | 'mensual';
  timestamp: string;
  periodo?: string;
  exito: boolean;
  mensaje?: string;
  envios?: Array<{ numero: string; exito: boolean }>;
}

export function ReportesPanel() {
  const ahora = new Date();
  const [mes, setMes] = useState(ahora.getMonth() + 1);
  const [anio, setAnio] = useState(ahora.getFullYear());
  const [enviandoDia, setEnviandoDia] = useState(false);
  const [enviandoMensual, setEnviandoMensual] = useState(false);
  const [historial, setHistorial] = useState<EnvioRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const mostrar = (msg: string, isError = false) => {
    if (isError) { setError(msg); setTimeout(() => setError(null), 5000); }
    else { setSuccess(msg); setTimeout(() => setSuccess(null), 4000); }
  };

  const handleEnviarDia = async () => {
    setEnviandoDia(true);
    try {
      const resultado = await api.enviarReporteDia();
      const record: EnvioRecord = {
        id: Date.now(),
        tipo: 'dia',
        timestamp: new Date().toLocaleString('es-PE'),
        exito: true,
        mensaje: 'Reporte diario enviado correctamente',
        envios: resultado?.envios || [],
      };
      setHistorial((prev) => [record, ...prev]);
      mostrar('Reporte del día enviado correctamente.');
    } catch (err: any) {
      const record: EnvioRecord = {
        id: Date.now(),
        tipo: 'dia',
        timestamp: new Date().toLocaleString('es-PE'),
        exito: false,
        mensaje: err?.message || 'Error al enviar el reporte',
      };
      setHistorial((prev) => [record, ...prev]);
      mostrar('Error al enviar reporte. Verifica la configuración de WhatsApp en el servidor.', true);
    } finally {
      setEnviandoDia(false);
    }
  };

  const handleEnviarMensual = async () => {
    setEnviandoMensual(true);
    try {
      const resultado = await api.enviarReporteMensual(mes, anio);
      const record: EnvioRecord = {
        id: Date.now(),
        tipo: 'mensual',
        timestamp: new Date().toLocaleString('es-PE'),
        periodo: `${MESES[mes - 1]} ${anio}`,
        exito: true,
        mensaje: `Reporte mensual de ${MESES[mes - 1]} ${anio} enviado`,
        envios: resultado?.envios || [],
      };
      setHistorial((prev) => [record, ...prev]);
      mostrar(`Reporte de ${MESES[mes - 1]} ${anio} enviado correctamente.`);
    } catch (err: any) {
      const record: EnvioRecord = {
        id: Date.now(),
        tipo: 'mensual',
        timestamp: new Date().toLocaleString('es-PE'),
        periodo: `${MESES[mes - 1]} ${anio}`,
        exito: false,
        mensaje: err?.message || 'Error al enviar el reporte mensual',
      };
      setHistorial((prev) => [record, ...prev]);
      mostrar('Error al enviar reporte mensual.', true);
    } finally {
      setEnviandoMensual(false);
    }
  };

  const hoy = ahora.toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const anioOptions = Array.from({ length: 5 }, (_, i) => ahora.getFullYear() - i);

  const previewDia = `🏥 RESUMEN DEL DÍA — Caja Clínica
📅 ${hoy}

💵 Caja:
  • Efectivo Esperado: S/ —
  • Digital Esperado: S/ —

⭐ Top Médicos Hoy:
  (datos del servidor)

✅ Reportes generados automáticamente.`;

  const previewMensual = `📊 REPORTE MENSUAL — ${MESES[mes - 1].toUpperCase()} ${anio}

📈 Ingresos Totales: S/ —
💰 Comisiones Pagadas: S/ —
👨‍⚕️ Médicos Activos: —

Top 3 Médicos:
  (datos del servidor)

Accede a detalles en el sistema.`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="white-card rounded-lg p-5 border border-zinc-200 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-zinc-700" />
          Reportes por WhatsApp
        </h2>
        <p className="text-xs text-zinc-500 mt-0.5">Envía resúmenes automáticos a los dueños y gerentes de la clínica</p>

        {/* Aviso modo */}
        <div className="mt-3 flex items-start gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs px-3 py-2.5 rounded-md">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Modo configuración:</span> Los mensajes se envían según el proveedor configurado en el servidor
            (<code className="bg-blue-100 px-1 rounded text-[10px]">WHATSAPP_PROVIDER</code>).
            En modo <code className="bg-blue-100 px-1 rounded text-[10px]">dummy</code>, los mensajes se imprimen en los logs del servidor.
          </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Reporte del Día */}
        <div className="white-card rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50">
            <h3 className="text-xs font-semibold text-zinc-900 flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-zinc-500" />
              Reporte del Día
            </h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">Resumen de caja actual + top médicos de hoy</p>
          </div>
          <div className="p-5 space-y-4">
            {/* Preview */}
            <div className="bg-zinc-950 text-green-400 font-mono text-[10px] p-4 rounded-lg leading-relaxed whitespace-pre-wrap border border-zinc-800 shadow-inner">
              {previewDia}
            </div>
            <button
              onClick={handleEnviarDia}
              disabled={enviandoDia}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold py-2.5 rounded-md flex items-center justify-center gap-2 transition disabled:opacity-60"
            >
              {enviandoDia ? (
                <><Clock className="h-3.5 w-3.5 animate-pulse" /> Enviando...</>
              ) : (
                <><Send className="h-3.5 w-3.5" /> Enviar Reporte del Día</>
              )}
            </button>
          </div>
        </div>

        {/* Reporte Mensual */}
        <div className="white-card rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50">
            <h3 className="text-xs font-semibold text-zinc-900 flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-zinc-500" />
              Reporte Mensual
            </h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">Resumen de ingresos y ranking del mes completo</p>
          </div>
          <div className="p-5 space-y-4">
            {/* Selector mes/año */}
            <div className="flex gap-2">
              <select
                value={mes}
                onChange={(e) => setMes(Number(e.target.value))}
                className="flex-1 h-9 rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-semibold text-zinc-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
              >
                {MESES.map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
              <select
                value={anio}
                onChange={(e) => setAnio(Number(e.target.value))}
                className="w-24 h-9 rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-semibold text-zinc-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
              >
                {anioOptions.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {/* Preview */}
            <div className="bg-zinc-950 text-green-400 font-mono text-[10px] p-4 rounded-lg leading-relaxed whitespace-pre-wrap border border-zinc-800 shadow-inner">
              {previewMensual}
            </div>
            <button
              onClick={handleEnviarMensual}
              disabled={enviandoMensual}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold py-2.5 rounded-md flex items-center justify-center gap-2 transition disabled:opacity-60"
            >
              {enviandoMensual ? (
                <><Clock className="h-3.5 w-3.5 animate-pulse" /> Enviando...</>
              ) : (
                <><Send className="h-3.5 w-3.5" /> Enviar Reporte {MESES[mes - 1]} {anio}</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Historial de envíos */}
      <div className="white-card rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Historial de Envíos (sesión actual)</span>
          {historial.length > 0 && (
            <button
              onClick={() => setHistorial([])}
              className="text-[10px] text-zinc-400 hover:text-zinc-600 transition"
            >
              Limpiar
            </button>
          )}
        </div>

        {historial.length === 0 ? (
          <div className="p-10 text-center text-zinc-400">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">Aún no se han enviado reportes en esta sesión</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {historial.map((rec) => (
              <div key={rec.id} className="px-5 py-3 flex items-start gap-3 hover:bg-zinc-50 transition">
                <div className={`mt-0.5 shrink-0 ${rec.exito ? 'text-emerald-500' : 'text-red-500'}`}>
                  {rec.exito
                    ? <CheckCircle className="h-4 w-4" />
                    : <XCircle className="h-4 w-4" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      rec.tipo === 'dia'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-violet-50 text-violet-700 border-violet-200'
                    }`}>
                      {rec.tipo === 'dia' ? 'DIARIO' : 'MENSUAL'}
                    </span>
                    {rec.periodo && (
                      <span className="text-[10px] text-zinc-500">{rec.periodo}</span>
                    )}
                    <span className="text-[10px] text-zinc-400">{rec.timestamp}</span>
                  </div>
                  <p className="text-xs text-zinc-700 mt-1">{rec.mensaje}</p>
                  {rec.envios && rec.envios.length > 0 && (
                    <div className="flex gap-2 mt-1.5 flex-wrap">
                      {rec.envios.map((env, i) => (
                        <span
                          key={i}
                          className={`text-[9px] font-medium px-2 py-0.5 rounded-full border ${
                            env.exito
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-red-50 text-red-600 border-red-200'
                          }`}
                        >
                          {env.numero} {env.exito ? '✓' : '✗'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
