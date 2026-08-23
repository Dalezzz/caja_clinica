import React, { useState, useEffect } from "react";
import { Receipt, X } from "lucide-react";
import type { Medico, Ticket } from "../api";

interface HistoryModalProps {
  tickets: Ticket[];
  medicos: Medico[];
  isOpen: boolean;
  historySearch: string;
  historyDoctorFilter: string;
  historyDateFrom: string;
  historyDateTo: string;
  historyPaymentFilter: string;
  historyStatusFilter: string;
  historyCurrentPage: number;
  onClose: () => void;
  setHistorySearch: (value: string) => void;
  setHistoryDoctorFilter: (value: string) => void;
  setHistoryDateFrom: (value: string) => void;
  setHistoryDateTo: (value: string) => void;
  setHistoryPaymentFilter: (value: string) => void;
  setHistoryStatusFilter: (value: string) => void;
  setHistoryCurrentPage: (value: number) => void;
  onPrintTicket: (ticket: Ticket) => void;
  onAnularTicket: (ticketId: number) => void;
  onEmitirSunat: (ticketId: number) => void;
  onDescargarSunatPdf: (ticketId: number) => void;
}

export function HistoryModal({
  tickets,
  medicos,
  isOpen,
  historySearch,
  historyDoctorFilter,
  historyDateFrom,
  historyDateTo,
  historyPaymentFilter,
  historyStatusFilter,
  historyCurrentPage,
  onClose,
  setHistorySearch,
  setHistoryDoctorFilter,
  setHistoryDateFrom,
  setHistoryDateTo,
  setHistoryPaymentFilter,
  setHistoryStatusFilter,
  setHistoryCurrentPage,
  onPrintTicket,
  onAnularTicket,
  onEmitirSunat,
  onDescargarSunatPdf,
}: HistoryModalProps) {
  const [localSearch, setLocalSearch] = useState(historySearch);

  useEffect(() => {
    setLocalSearch(historySearch);
  }, [historySearch, isOpen]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearch !== historySearch) {
        setHistorySearch(localSearch);
        setHistoryCurrentPage(1);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [localSearch, historySearch, setHistorySearch, setHistoryCurrentPage]);

  if (!isOpen) return null;

  const filteredTickets = tickets.filter((t) => {
    const searchLower = historySearch.toLowerCase().trim();
    if (searchLower) {
      const matchesPatient = t.paciente?.nombre
        ?.toLowerCase()
        .includes(searchLower);
      const matchesTicket = t.numeroTicket?.toLowerCase().includes(searchLower);
      const matchesBoleta = t.numeroBoleta?.toLowerCase().includes(searchLower);
      const matchesRuc = t.rucFactura?.toLowerCase().includes(searchLower);
      if (!matchesPatient && !matchesTicket && !matchesBoleta && !matchesRuc)
        return false;
    }

    if (historyDoctorFilter && t.medicoId !== Number(historyDoctorFilter)) {
      return false;
    }

    if (historyPaymentFilter && t.metodoPago !== historyPaymentFilter) {
      return false;
    }

    if (historyStatusFilter && t.estado !== historyStatusFilter) {
      return false;
    }

    if (historyDateFrom) {
      const dateFromObj = new Date(historyDateFrom);
      dateFromObj.setHours(0, 0, 0, 0);
      if (new Date(t.fecha) < dateFromObj) return false;
    }

    if (historyDateTo) {
      const dateToObj = new Date(historyDateTo);
      dateToObj.setHours(23, 59, 59, 999);
      if (new Date(t.fecha) > dateToObj) return false;
    }

    return true;
  });

  const itemsPerPage = 15;
  const totalItems = filteredTickets.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const currentPage = Math.min(historyCurrentPage, totalPages);
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-zinc-200 w-full max-w-5xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in-50 zoom-in-95">
        <div className="px-6 py-4 border-b border-zinc-150 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-zinc-900" />
            <div>
              <h3 className="font-semibold text-zinc-900 text-sm">
                Historial Completo de Comprobantes
              </h3>
              <p className="text-[11px] text-zinc-500">
                Mostrando {totalItems} registros coincidentes de un total de{" "}
                {tickets.length}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-900 transition p-1 hover:bg-zinc-100 rounded-md"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="bg-zinc-50/50 p-4 border-b border-zinc-150 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2">
            <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Buscar Paciente / Ticket / RUC
            </label>
            <input
              type="text"
              placeholder="Ej. Juan Perez, 2026-07-30..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Médico Tratante
            </label>
            <select
              value={historyDoctorFilter}
              onChange={(e) => {
                setHistoryDoctorFilter(e.target.value);
                setHistoryCurrentPage(1);
              }}
              className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-800 font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
            >
              <option value="">-- Todos --</option>
              {medicos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Método de Pago
            </label>
            <select
              value={historyPaymentFilter}
              onChange={(e) => {
                setHistoryPaymentFilter(e.target.value);
                setHistoryCurrentPage(1);
              }}
              className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-800 font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
            >
              <option value="">-- Todos --</option>
              <option value="EFECTIVO">Efectivo</option>
              <option value="PLIN">Plin/Yape</option>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="TARJETA">Tarjeta POS</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Estado
            </label>
            <select
              value={historyStatusFilter}
              onChange={(e) => {
                setHistoryStatusFilter(e.target.value);
                setHistoryCurrentPage(1);
              }}
              className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-800 font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
            >
              <option value="">-- Todos --</option>
              <option value="ACTIVO">Activo</option>
              <option value="ANULADO">Anulado</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setHistorySearch("");
                setHistoryDoctorFilter("");
                setHistoryDateFrom("");
                setHistoryDateTo("");
                setHistoryPaymentFilter("");
                setHistoryStatusFilter("");
                setHistoryCurrentPage(1);
              }}
              className="h-8 w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold border border-zinc-200 rounded-md text-xs transition"
            >
              Limpiar Filtros
            </button>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Desde Fecha
            </label>
            <input
              type="date"
              value={historyDateFrom}
              onChange={(e) => {
                setHistoryDateFrom(e.target.value);
                setHistoryCurrentPage(1);
              }}
              className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-xs text-zinc-800 focus-visible:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Hasta Fecha
            </label>
            <input
              type="date"
              value={historyDateTo}
              onChange={(e) => {
                setHistoryDateTo(e.target.value);
                setHistoryCurrentPage(1);
              }}
              className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-xs text-zinc-800 focus-visible:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-[300px]">
          {paginatedTickets.length === 0 ? (
            <div className="text-center py-20 text-zinc-400 text-xs">
              No se encontraron comprobantes coincidentes con los filtros
              aplicados.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 text-zinc-500 uppercase font-semibold text-[10px] tracking-wider border-b border-zinc-200 sticky top-0 z-10">
                  <th className="p-3 pl-6">Comprobante</th>
                  <th className="p-3">Fecha / Hora</th>
                  <th className="p-3">Paciente</th>
                  <th className="p-3">Médico</th>
                  <th className="p-3">Monto</th>
                  <th className="p-3">Forma Pago</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 pr-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 bg-white">
                {paginatedTickets.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-zinc-50/50 transition-colors"
                  >
                    <td className="p-3 pl-6">
                      <div className="font-mono font-semibold text-zinc-900">
                        {t.numeroBoleta || t.numeroTicket}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-medium">
                        {(
                          t.tipoComprobante ||
                          (t.numeroBoleta
                            ? "BOLETA_ELECTRONICA"
                            : "TICKET_INTERNO")
                        )
                          .replace("_ELECTRONICA", "")
                          .replace("_INTERNO", "")}
                      </div>
                    </td>
                    <td className="p-3 text-zinc-500">
                      {new Date(t.fecha).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-zinc-950">
                        {t.paciente?.nombre}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        Doc: {t.paciente?.numeroDocumento || "S/D"} • Cel:{" "}
                        {t.paciente?.celular || "S/N"}
                      </div>
                    </td>
                    <td className="p-3 text-zinc-600">
                      <div>Dr. {t.medico?.nombre}</div>
                      <div className="text-[10px] text-zinc-400">
                        {t.consultorio}
                      </div>
                    </td>
                    <td className="p-3 font-bold text-zinc-950">
                      S/ {Number(t.montoPaciente).toFixed(2)}
                    </td>
                    <td className="p-3">
                      <span className="bg-zinc-100 text-zinc-800 border border-zinc-200 text-[10px] font-semibold px-2 py-0.5 rounded">
                        {t.metodoPago}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                            t.estado === "ACTIVO"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {t.estado}
                        </span>
                        {t.sunatEstado === "EMITIDO" && (
                          <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-medium ring-1 ring-inset bg-blue-50 text-blue-700 ring-blue-600/20">
                            SUNAT OK
                          </span>
                        )}
                        {t.sunatEstado === "ERROR" && (
                          <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-medium ring-1 ring-inset bg-red-50 text-red-700 ring-red-600/20" title={t.sunatError}>
                            SUNAT ERR
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 pr-6 text-right space-x-1.5">
                      <button
                        onClick={() => onPrintTicket(t)}
                        className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-650 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 px-2 py-1 rounded transition"
                      >
                        <Receipt className="h-3 w-3" /> Imprimir
                      </button>
                      {t.estado === "ACTIVO" && (
                        <button
                          onClick={() => onAnularTicket(t.id)}
                          className="inline-flex items-center gap-1 text-[10px] font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 px-2 py-1 rounded transition"
                        >
                          Anular
                        </button>
                      )}
                      
                      {t.estado === "ACTIVO" && (
                        t.sunatEstado === "EMITIDO" ? (
                          <button
                            onClick={() => onDescargarSunatPdf(t.id)}
                            className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded transition"
                          >
                            PDF Boleta
                          </button>
                        ) : (
                          <button
                            onClick={() => onEmitirSunat(t.id)}
                            className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded transition"
                          >
                            Emitir SUNAT
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-zinc-150 bg-zinc-50/50 flex items-center justify-between text-xs">
            <div className="text-zinc-500">
              Página{" "}
              <span className="font-semibold text-zinc-800">{currentPage}</span>{" "}
              de{" "}
              <span className="font-semibold text-zinc-800">{totalPages}</span>
            </div>
            <div className="flex gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() =>
                  setHistoryCurrentPage(Math.max(1, currentPage - 1))
                }
                className="px-3 py-1 bg-white border border-zinc-200 rounded text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:hover:bg-white transition"
              >
                Anterior
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() =>
                  setHistoryCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                className="px-3 py-1 bg-white border border-zinc-200 rounded text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:hover:bg-white transition"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
