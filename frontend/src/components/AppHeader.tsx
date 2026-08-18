import { Wallet } from "lucide-react";
import type { CajaDiaria } from "../api";
import type { TabType } from "../types";

interface AppHeaderProps {
  activeTab: TabType;
  caja: CajaDiaria | null;
  currentTime: string;
  onOpenCaja: () => void;
}

export function AppHeader({
  activeTab,
  caja,
  currentTime,
  onOpenCaja,
}: AppHeaderProps) {
  const titleMap: Record<TabType, string> = {
    pos: "Admisión & Ventas POS",
    cola: "Cola de pacientes",
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
  };

  return (
    <header className="bg-white border-b border-zinc-200 sticky top-0 z-20 px-6 py-4 flex items-center justify-between gap-4">
      <div className="font-bold text-zinc-800 text-xs uppercase tracking-wider">
        Módulo: {titleMap[activeTab]}
      </div>

      <div className="flex items-center gap-3">
        {caja?.abierta ? (
          <div className="bg-white border border-zinc-200 rounded-lg px-4 py-1.5 flex items-center gap-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                TURNO ACTIVO
              </span>
            </div>
            <div className="h-5 w-px bg-zinc-250"></div>
            <div className="text-right">
              <div className="text-[9px] text-zinc-400 uppercase font-medium">
                Efectivo Esperado
              </div>
              <div className="text-sm font-semibold text-zinc-950">
                S/ {Number(caja.montoEfectivoEsperado).toFixed(2)}
              </div>
            </div>
            <div className="text-right border-l border-zinc-200 pl-3">
              <div className="text-[9px] text-zinc-400 uppercase font-medium">
                Digital (Yape/POS)
              </div>
              <div className="text-sm font-semibold text-zinc-800">
                S/ {Number(caja.montoDigitalEsperado).toFixed(2)}
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenCaja}
            className="bg-zinc-900 hover:bg-zinc-900/90 text-zinc-50 font-semibold px-4 py-2 rounded-md shadow flex items-center gap-2 transition text-xs"
          >
            <Wallet className="h-4 w-4" /> ABRIR CAJA DE ATENCIÓN (S/ 100)
          </button>
        )}

        <div className="hidden md:flex items-center gap-1 text-[10px] text-zinc-500 font-medium">
          <span>{currentTime}</span>
        </div>
      </div>
    </header>
  );
}
