import { FileSpreadsheet, Upload } from "lucide-react";

interface ImporterPanelProps {
  excelFile: File | null;
  importing: boolean;
  dryRunData: any | null;
  onFileChange: (file: File | null) => void;
  onDryRun: () => void;
  onConfirmImport: () => void;
}

export function ImporterPanel({
  excelFile,
  importing,
  dryRunData,
  onFileChange,
  onDryRun,
  onConfirmImport,
}: ImporterPanelProps) {
  return (
    <div className="max-w-3xl mx-auto white-card rounded-lg p-6 border border-zinc-200 shadow-sm space-y-6">
      <div className="border-b border-zinc-100 pb-4">
        <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-zinc-900" /> Importador
          Masivo de Hojas Excel Históricas
        </h2>
        <p className="text-xs text-zinc-550">
          Previsualización dry-run e inserción transaccional en PostgreSQL
        </p>
      </div>

      <div className="border border-dashed border-zinc-300 hover:border-zinc-500 bg-zinc-50/30 rounded-lg p-8 text-center space-y-3 transition">
        <Upload className="h-8 w-8 text-zinc-400 mx-auto" />
        <div>
          <p className="text-xs font-semibold text-zinc-900">
            Arrastre el archivo Excel consolidado de caja (.xlsx)
          </p>
          <p className="text-[11px] text-zinc-500">
            Soporta pestañas de Consultas, Rayos X, Certificados y Egresos
          </p>
        </div>

        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={(e) => onFileChange(e.target.files?.[0] || null)}
          className="hidden"
          id="excel-input"
        />
        <label
          htmlFor="excel-input"
          className="inline-block bg-white hover:bg-zinc-50 text-zinc-800 font-medium px-4 py-1.5 rounded-md border border-zinc-200 cursor-pointer text-[11px] shadow-sm transition"
        >
          {excelFile ? excelFile.name : "Seleccionar Archivo Excel"}
        </label>
      </div>

      {excelFile && (
        <button
          onClick={onDryRun}
          disabled={importing}
          className="w-full bg-zinc-900 hover:bg-zinc-900/90 text-zinc-50 font-medium py-2 rounded-md shadow transition text-xs disabled:opacity-55 flex items-center justify-center gap-2"
        >
          {importing
            ? "PROCESANDO ARCHIVO EXCEL..."
            : "EJECUTAR PREVISUALIZACIÓN DRY-RUN"}
        </button>
      )}

      {dryRunData && (
        <div className="bg-zinc-50/50 p-5 rounded-lg border border-zinc-200 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
            <span className="text-xs font-semibold text-zinc-900">
              Resultado Dry-Run ({dryRunData.mesIdentificado})
            </span>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium px-2 py-0.5 rounded-md">
              Analizado Correctamente
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-white p-2.5 rounded-md border border-zinc-200">
              <div className="text-[9px] text-zinc-500 font-medium uppercase">
                Ingresos
              </div>
              <div className="text-sm font-semibold text-zinc-950 mt-1">
                S/ {dryRunData.totalCobrado.toFixed(2)}
              </div>
            </div>
            <div className="bg-white p-2.5 rounded-md border border-zinc-200">
              <div className="text-[9px] text-zinc-500 font-medium uppercase">
                Tickets
              </div>
              <div className="text-sm font-semibold text-zinc-950 mt-1">
                {dryRunData.totalTickets}
              </div>
            </div>
            <div className="bg-white p-2.5 rounded-md border border-zinc-200">
              <div className="text-[9px] text-zinc-500 font-medium uppercase">
                Gastos
              </div>
              <div className="text-sm font-semibold text-rose-600 mt-1">
                S/ {dryRunData.totalEgresosMonto.toFixed(2)}
              </div>
            </div>
            <div className="bg-white p-2.5 rounded-md border border-zinc-200">
              <div className="text-[9px] text-zinc-500 font-medium uppercase">
                Cant. Egresos
              </div>
              <div className="text-sm font-semibold text-rose-600 mt-1">
                {dryRunData.totalEgresos}
              </div>
            </div>
          </div>

          {dryRunData.medicosNuevos && dryRunData.medicosNuevos.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-semibold text-zinc-700">
                Médicos Nuevos Detectados ({dryRunData.medicosNuevos.length}):
              </div>
              <div className="flex flex-wrap gap-1">
                {dryRunData.medicosNuevos.map((med: string, i: number) => (
                  <span
                    key={i}
                    className="bg-zinc-100 text-zinc-800 text-[10px] px-2 py-0.5 rounded border border-zinc-200"
                  >
                    {med}
                  </span>
                ))}
              </div>
            </div>
          )}

          {dryRunData.procedenciasNuevas &&
            dryRunData.procedenciasNuevas.length > 0 && (
              <div className="space-y-1">
                <div className="text-[10px] font-semibold text-zinc-700">
                  Procedencias Nuevas ({dryRunData.procedenciasNuevas.length}):
                </div>
                <div className="flex flex-wrap gap-1">
                  {dryRunData.procedenciasNuevas.map(
                    (proc: string, i: number) => (
                      <span
                        key={i}
                        className="bg-zinc-100 text-zinc-800 text-[10px] px-2 py-0.5 rounded border border-zinc-200"
                      >
                        {proc}
                      </span>
                    ),
                  )}
                </div>
              </div>
            )}

          {dryRunData.alertas && dryRunData.alertas.length > 0 && (
            <div className="space-y-1 bg-amber-50/50 border border-amber-200 p-3 rounded-md">
              <div className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider">
                Alertas / Advertencias:
              </div>
              <ul className="list-disc pl-4 text-[10px] text-amber-700 space-y-0.5">
                {dryRunData.alertas.map((alt: string, i: number) => (
                  <li key={i}>{alt}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={onConfirmImport}
            disabled={importing}
            className="w-full bg-zinc-900 hover:bg-zinc-900/90 text-zinc-50 font-medium py-2.5 rounded-md shadow transition text-xs disabled:opacity-55"
          >
            {importing
              ? "GUARDANDO EN BASE DE DATOS..."
              : "CONFIRMAR E INSERTAR EN BASE DE DATOS"}
          </button>
        </div>
      )}
    </div>
  );
}
