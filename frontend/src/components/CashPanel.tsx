import { TrendingUp, Wallet } from "lucide-react";
import type { Egreso, CajaDiaria } from "../api";

interface CashPanelProps {
  caja: CajaDiaria | null;
  montoFisicoCierre: string;
  observacionesCierre: string;
  tipoEgreso: Egreso["tipoEgreso"];
  montoEgreso: string;
  observacionEgreso: string;
  proveedorEgreso: string;
  onMontoFisicoCierreChange: (value: string) => void;
  onObservacionesCierreChange: (value: string) => void;
  onCloseCaja: () => void;
  onTipoEgresoChange: (value: Egreso["tipoEgreso"]) => void;
  onMontoEgresoChange: (value: string) => void;
  onObservacionEgresoChange: (value: string) => void;
  onProveedorEgresoChange: (value: string) => void;
  onCreateEgreso: (e: React.FormEvent) => void;
  activeTab: "cierre" | "egresos";
}

export function CashPanel({
  caja,
  montoFisicoCierre,
  observacionesCierre,
  tipoEgreso,
  montoEgreso,
  observacionEgreso,
  proveedorEgreso,
  onMontoFisicoCierreChange,
  onObservacionesCierreChange,
  onCloseCaja,
  onTipoEgresoChange,
  onMontoEgresoChange,
  onObservacionEgresoChange,
  onProveedorEgresoChange,
  onCreateEgreso,
  activeTab,
}: CashPanelProps) {
  if (activeTab === "cierre") {
    return (
      <div className="max-w-2xl mx-auto white-card rounded-lg p-6 border border-zinc-200 shadow-sm space-y-6">
        <div className="border-b border-zinc-100 pb-4">
          <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
            <Wallet className="h-4 w-4 text-zinc-900" /> Arqueo Ciego de Caja
            Chica
          </h2>
          <p className="text-xs text-zinc-550">
            Protocolo de seguridad: Ingrese el dinero contado en físico sin
            visualizar previamente el saldo esperado
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-zinc-50/50 p-4 rounded-lg border border-zinc-200 grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                Monto Apertura
              </div>
              <div className="text-base font-semibold text-zinc-950 mt-0.5">
                S/ {Number(caja?.montoApertura || 0).toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                Estado Actual
              </div>
              <div className="text-base font-semibold text-emerald-700 uppercase mt-0.5">
                Turno Abierto
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
              Ingrese el Efectivo Físico Total Contado en Caja (S/) *
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="0.00"
              value={montoFisicoCierre}
              onChange={(e) => onMontoFisicoCierreChange(e.target.value)}
              className="h-11 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-base font-semibold text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">
              Observaciones de Recepción
            </label>
            <textarea
              rows={2}
              placeholder="Notas de billetes en mal estado o vuelto de caja..."
              value={observacionesCierre}
              onChange={(e) => onObservacionesCierreChange(e.target.value)}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
            />
          </div>

          {montoFisicoCierre !== "" && (
            <div className="bg-zinc-950 text-zinc-50 p-4 rounded-lg space-y-1.5 shadow-sm border border-zinc-800 animate-in fade-in">
              <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                Resultado Auditoría de Cierre
              </div>
              <div className="flex justify-between text-xs font-medium">
                <span>Efectivo Físico Declarado:</span>
                <span>S/ {Number(montoFisicoCierre).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs font-medium border-t border-zinc-850 pt-1">
                <span>Efectivo Esperado en Sistema:</span>
                <span>
                  S/ {Number(caja?.montoEfectivoEsperado || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-semibold border-t border-zinc-850 pt-1">
                <span>Diferencia:</span>
                <span
                  className={
                    Number(montoFisicoCierre) -
                      Number(caja?.montoEfectivoEsperado || 0) >=
                    0
                      ? "text-emerald-400"
                      : "text-rose-450"
                  }
                >
                  S/{" "}
                  {(
                    Number(montoFisicoCierre) -
                    Number(caja?.montoEfectivoEsperado || 0)
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={onCloseCaja}
            className="w-full bg-zinc-900 hover:bg-zinc-900/90 text-zinc-50 font-medium py-2.5 rounded-md shadow transition text-xs"
          >
            PROCESAR CIERRE DE TURNO Y ARQUEO
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5 white-card rounded-lg p-5 border border-zinc-200 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-zinc-800" /> Registrar Egreso /
          Gasto
        </h2>

        <form onSubmit={onCreateEgreso} className="space-y-3">
          <div>
            <label className="block text-[11px] font-medium text-zinc-500 mb-1">
              Tipo de Egreso *
            </label>
            <select
              value={tipoEgreso}
              onChange={(e) =>
                onTipoEgresoChange(e.target.value as Egreso["tipoEgreso"])
              }
              className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
            >
              <option value="GASTO">Gasto Operativo (Insumos/Limpieza)</option>
              <option value="PLANILLA">Pago Planilla / Personal</option>
              <option value="PAGO_FIJO">
                Servicio Fijo (Luz/Agua/Internet)
              </option>
              <option value="ASCENSOR">Proyecto Ascensor</option>
              <option value="DEVOLUCION">Devolución a Paciente</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-500 mb-1">
              Monto Egreso (S/) *
            </label>
            <input
              type="number"
              step="0.5"
              required
              placeholder="50.00"
              value={montoEgreso}
              onChange={(e) => onMontoEgresoChange(e.target.value)}
              className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-500 mb-1">
              Proveedor / Beneficiario
            </label>
            <input
              type="text"
              placeholder="Ej. Botica Central / Imprenta"
              value={proveedorEgreso}
              onChange={(e) => onProveedorEgresoChange(e.target.value)}
              className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-500 mb-1">
              Concepto / Glosa *
            </label>
            <textarea
              rows={2}
              required
              placeholder="Compra de insumos médicos y mascarillas"
              value={observacionEgreso}
              onChange={(e) => onObservacionEgresoChange(e.target.value)}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-zinc-900 hover:bg-zinc-900/90 text-zinc-50 font-medium py-2 rounded-md text-xs shadow transition"
          >
            REGISTRAR EGRESO DE CAJA
          </button>
        </form>
      </div>

      <div className="lg:col-span-7 white-card rounded-lg p-5 border border-zinc-200 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-3">
          Egresos Registrados en Turno
        </h2>

        <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin">
          {caja ? (
            <div className="text-center py-12 text-zinc-400 text-xs">
              Sin egresos registrados.
            </div>
          ) : (
            <div className="text-center py-12 text-zinc-400 text-xs">
              Sin egresos registrados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
