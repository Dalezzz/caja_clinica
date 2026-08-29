import { useState, useEffect } from "react";
import { Wallet, Clock, Activity } from "lucide-react";
import type { CajaDiaria } from "../api";
import type { TabType } from "../types";

interface AppHeaderProps {
  activeTab: TabType;
  caja: CajaDiaria | null;
  currentTime?: string;
  onOpenCaja: () => void;
}

export function AppHeader({
  activeTab,
  caja,
  currentTime: propTime,
  onOpenCaja,
}: AppHeaderProps) {
  const [localTime, setLocalTime] = useState(
    propTime || new Date().toLocaleTimeString(),
  );

  useEffect(() => {
    const timer = setInterval(
      () => setLocalTime(new Date().toLocaleTimeString()),
      1000,
    );
    return () => clearInterval(timer);
  }, []);
  const titleMap: Record<TabType, string> = {
    pos: "Admisión & Ventas POS",
    cola: "Cola de Pacientes",
    cierre: "Arqueo de Caja",
    egresos: "Egresos & Gastos",
    importer: "Importador Excel",
    liquidaciones: "Liquidación Médica",
    tarifario: "Tarifario de Servicios",
    admin: "Configuración & Admin",
    alquileres: "Alquileres de Espacios",
    comprobantes: "Comprobantes de Pago Médico",
    estadisticas: "Estadísticas de Médicos",
    reportes: "Reportes por WhatsApp",
    farmacia: "Farmacia & Kardex",
  };

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-zinc-200/80 sticky top-0 z-20 px-6 py-3.5 flex items-center justify-between gap-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 bg-zinc-100/80 rounded-lg border border-zinc-200">
          <Activity className="h-4 w-4 text-emerald-600 animate-pulse" />
          <span className="font-bold text-zinc-800 text-xs tracking-tight">
            {titleMap[activeTab]}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {caja?.abierta ? (
          <div className="bg-white border border-zinc-200 rounded-xl px-4 py-1.5 flex items-center gap-4 shadow-sm hover:border-zinc-300 transition-all">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
              </span>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                TURNO ACTIVO
              </span>
            </div>
            <div className="h-5 w-px bg-zinc-200"></div>
            <div className="text-right">
              <div className="text-[9px] text-zinc-400 uppercase font-semibold">
                Efectivo Esperado
              </div>
              <div className="text-xs font-bold text-zinc-950">
                S/ {Number(caja.montoEfectivoEsperado).toFixed(2)}
              </div>
            </div>
            <div className="text-right border-l border-zinc-200 pl-3">
              <div className="text-[9px] text-zinc-400 uppercase font-semibold">
                Digital (Yape/POS)
              </div>
              <div className="text-xs font-bold text-sky-700">
                S/ {Number(caja.montoDigitalEsperado).toFixed(2)}
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenCaja}
            className="bg-zinc-950 hover:bg-zinc-800 text-white font-semibold px-4 py-2 rounded-xl shadow-sm flex items-center gap-2.5 transition-all text-xs active:scale-[0.98]"
          >
            <Wallet className="h-4 w-4 text-emerald-400" /> ABRIR CAJA DE ATENCIÓN (S/ 100)
          </button>
        )}

        <div className="hidden md:flex items-center gap-1.5 text-xs text-zinc-500 font-semibold bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-200/80">
          <Clock className="h-3.5 w-3.5 text-zinc-400" />
          <span>{localTime}</span>
        </div>
      </div>
    </header>
  );
}
