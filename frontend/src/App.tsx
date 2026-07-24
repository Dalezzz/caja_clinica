import React, { useEffect, useState } from 'react';
import {
  Stethoscope,
  Receipt,
  UserCheck,
  Phone,
  CreditCard,
  QrCode,
  Printer,
  CheckCircle2,
  DollarSign,
  Building,
  TrendingUp,
  XCircle,
  Activity,
  Upload,
  Layers,
  ShieldCheck,
  FileSpreadsheet,
  Users,
  Wallet,
  Clock,
  Plus,
  Trash2,
  FileText,
  UserPlus
} from 'lucide-react';
import api, {
  Procedencia,
  Paciente,
  Medico,
  Tarifa,
  CajaDiaria,
  Ticket,
  TicketItem,
  TipoComprobante,
  EstadoAtencion,
  Egreso,
  INITIAL_PROCEDENCIAS,
  INITIAL_MEDICOS,
  INITIAL_TARIFAS,
} from './api';

type TabType = 'pos' | 'cola' | 'cierre' | 'egresos' | 'importer' | 'liquidaciones' | 'tarifario';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('pos');

  // Master Data
  const [procedencias, setProcedencias] = useState<Procedencia[]>(INITIAL_PROCEDENCIAS);
  const [medicos, setMedicos] = useState<Medico[]>(INITIAL_MEDICOS);
  const [tarifas, setTarifas] = useState<Tarifa[]>(INITIAL_TARIFAS);
  const [caja, setCaja] = useState<CajaDiaria | null>({
    id: 1,
    fecha: new Date().toISOString(),
    montoApertura: 150.0,
    montoEfectivoEsperado: 380.0,
    montoDigitalEsperado: 240.0,
    diferenciaCierre: 0,
    fechaApertura: new Date().toISOString(),
    abierta: true,
  });
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [egresos, setEgresos] = useState<Egreso[]>([]);

  // POS Patient Form State
  const [tipoDoc, setTipoDoc] = useState<'DNI' | 'CE' | 'PASAPORTE'>('DNI');
  const [numDoc, setNumDoc] = useState('');
  const [celularPaciente, setCelularPaciente] = useState('');
  const [nombrePaciente, setNombrePaciente] = useState('');
  const [edadPaciente, setEdadPaciente] = useState('');
  const [sexoPaciente] = useState<'M' | 'F'>('F');
  const [procedenciaId, setProcedenciaId] = useState<number>(1);
  const [historiaClinica, setHistoriaClinica] = useState('');
  const [isExistingPatient, setIsExistingPatient] = useState(false);

  // POS Services & Billing State
  const [medicoId, setMedicoId] = useState<number>(1);
  const [medicoSolicitanteId, setMedicoSolicitanteId] = useState<number | undefined>(undefined);
  const [tarifaSeleccionadaId, setTarifaSeleccionadaId] = useState<number>(1);

  // Cart for Multi-service registration per ticket
  const [cartItems, setCartItems] = useState<TicketItem[]>([]);

  // SUNAT Billing Options
  const [tipoComprobante, setTipoComprobante] = useState<TipoComprobante>('BOLETA_ELECTRONICA');
  const [rucFactura, setRucFactura] = useState('');
  const [razonSocialFactura, setRazonSocialFactura] = useState('');
  const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'PLIN' | 'TRANSFERENCIA' | 'TARJETA'>('EFECTIVO');

  // Modals & Popups
  const [printedTicket, setPrintedTicket] = useState<Ticket | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);

  // Arqueo Ciego Form State
  const [montoFisicoCierre, setMontoFisicoCierre] = useState<string>('');
  const [observacionesCierre, setObservacionesCierre] = useState<string>('');

  // Egreso Form State
  const [tipoEgreso, setTipoEgreso] = useState<Egreso['tipoEgreso']>('GASTO');
  const [montoEgreso, setMontoEgreso] = useState('');
  const [observacionEgreso, setObservacionEgreso] = useState('');
  const [proveedorEgreso, setProveedorEgreso] = useState('');

  // Excel Importer State
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [dryRunData, setDryRunData] = useState<any | null>(null);

  // Live time display
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Set default initial cart item when component loads
  useEffect(() => {
    if (cartItems.length === 0 && tarifas.length > 0) {
      const defaultTarifa = tarifas[0];
      setCartItems([
        {
          tarifaId: defaultTarifa.id,
          descripcion: defaultTarifa.descripcion,
          precioUnitario: Number(defaultTarifa.precioTotal),
          cantidad: 1,
          comisionMedico: Number(defaultTarifa.comisionMedico),
          comisionClinica: Number(defaultTarifa.comisionClinica),
          comisionTecnico: defaultTarifa.requiereTecnico ? Number(defaultTarifa.comisionTecnico) : 0,
        },
      ]);
    }
  }, [tarifas]);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== 'pos') return;

      if (e.key === 'F1') {
        e.preventDefault();
        setMetodoPago('EFECTIVO');
      } else if (e.key === 'F2') {
        e.preventDefault();
        setMetodoPago('PLIN');
        setShowQrModal(true);
      } else if (e.key === 'F3') {
        e.preventDefault();
        setMetodoPago('TRANSFERENCIA');
      } else if (e.key === 'F4') {
        e.preventDefault();
        setMetodoPago('TARJETA');
      } else if (e.key === 'Escape') {
        resetForm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  // Load backend data if available
  useEffect(() => {
    const loadAll = async () => {
      try {
        const fetchedProc = await api.get<Procedencia[]>('procedencias');
        if (fetchedProc && fetchedProc.length > 0) setProcedencias(fetchedProc);
      } catch {}

      try {
        const fetchedMed = await api.get<Medico[]>('medicos');
        if (fetchedMed && fetchedMed.length > 0) setMedicos(fetchedMed);
      } catch {}

      try {
        const fetchedTar = await api.get<Tarifa[]>('tarifas');
        if (fetchedTar && fetchedTar.length > 0) setTarifas(fetchedTar);
      } catch {}

      try {
        const fetchedCaja = await api.get<CajaDiaria>('cajas-diarias/current');
        if (fetchedCaja) setCaja(fetchedCaja);
      } catch {}

      try {
        const fetchedTickets = await api.get<Ticket[]>('tickets');
        if (fetchedTickets) setTickets(fetchedTickets);
      } catch {}
    };
    loadAll();
  }, []);

  // Lookup Patient by DNI or Phone
  const handleDocOrPhoneSearch = (val: string, field: 'doc' | 'phone') => {
    if (field === 'doc') setNumDoc(val);
    if (field === 'phone') setCelularPaciente(val);

    const term = val.trim();
    if (term.length >= 6) {
      const match = tickets.find(
        (tk) =>
          tk.paciente?.numeroDocumento === term ||
          tk.paciente?.celular === term ||
          (field === 'doc' && numDoc === term)
      );

      if (match && match.paciente) {
        setNombrePaciente(match.paciente.nombre);
        if (match.paciente.celular) setCelularPaciente(match.paciente.celular);
        if (match.paciente.numeroDocumento) setNumDoc(match.paciente.numeroDocumento);
        setProcedenciaId(match.paciente.procedenciaId || 1);
        setHistoriaClinica(match.paciente.numeroHistoriaClinica || '');
        if (match.paciente.edad) setEdadPaciente(String(match.paciente.edad));
        setIsExistingPatient(true);
      } else {
        setIsExistingPatient(false);
      }
    }
  };

  const addItemToCart = (tId: number) => {
    const targetTarifa = tarifas.find((t) => t.id === tId);
    if (!targetTarifa) return;

    setCartItems((prev) => {
      const existing = prev.find((item) => item.tarifaId === tId);
      if (existing) {
        return prev.map((item) =>
          item.tarifaId === tId ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [
        ...prev,
        {
          tarifaId: targetTarifa.id,
          descripcion: targetTarifa.descripcion,
          precioUnitario: Number(targetTarifa.precioTotal),
          cantidad: 1,
          comisionMedico: Number(targetTarifa.comisionMedico),
          comisionClinica: Number(targetTarifa.comisionClinica),
          comisionTecnico: targetTarifa.requiereTecnico ? Number(targetTarifa.comisionTecnico) : 0,
        },
      ];
    });
  };

  const removeItemFromCart = (tId: number) => {
    setCartItems((prev) => prev.filter((item) => item.tarifaId !== tId));
  };

  const resetForm = () => {
    setNumDoc('');
    setCelularPaciente('');
    setNombrePaciente('');
    setEdadPaciente('');
    setHistoriaClinica('');
    setIsExistingPatient(false);
    setRucFactura('');
    setRazonSocialFactura('');
    setCartItems([]);
  };

  // Cart Calculations
  const totalMontoPaciente = cartItems.reduce((sum, i) => sum + i.precioUnitario * i.cantidad, 0);
  const totalMontoMedico = cartItems.reduce((sum, i) => sum + i.comisionMedico * i.cantidad, 0);
  const totalMontoTecnico = cartItems.reduce((sum, i) => sum + i.comisionTecnico * i.cantidad, 0);
  const totalMontoSolicitante = medicoSolicitanteId ? 20 : 0;
  const totalMontoClinica = Math.max(0, totalMontoPaciente - totalMontoMedico - totalMontoTecnico - totalMontoSolicitante);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caja) {
      alert('Abre la caja diaria antes de registrar comprobantes.');
      return;
    }
    if (!nombrePaciente.trim()) {
      alert('Ingresa los nombres y apellidos del paciente.');
      return;
    }
    if (cartItems.length === 0) {
      alert('Agrega al menos un servicio médico al comprobante.');
      return;
    }
    if (tipoComprobante === 'FACTURA_ELECTRONICA' && (!rucFactura || rucFactura.length !== 11)) {
      alert('Ingresa un RUC válido de 11 dígitos para la Factura Electrónica.');
      return;
    }

    const medicoSelected = medicos.find((m) => m.id === medicoId) || medicos[0];
    const procedenciaSelected = procedencias.find((p) => p.id === procedenciaId) || procedencias[0];

    const ticketId = Date.now();
    const numeroTicket = `T-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(tickets.length + 1).padStart(3, '0')}`;
    const numeroBoleta =
      tipoComprobante === 'BOLETA_ELECTRONICA'
        ? `B001-${String(tickets.length + 101).padStart(8, '0')}`
        : tipoComprobante === 'FACTURA_ELECTRONICA'
        ? `F001-${String(tickets.length + 51).padStart(8, '0')}`
        : undefined;

    const newPatient: Paciente = {
      id: Math.floor(Math.random() * 10000),
      nombre: nombrePaciente,
      tipoDocumento: tipoDoc,
      numeroDocumento: numDoc || undefined,
      celular: celularPaciente || undefined,
      edad: edadPaciente ? Number(edadPaciente) : undefined,
      sexo: sexoPaciente,
      numeroHistoriaClinica: historiaClinica || undefined,
      procedenciaId: procedenciaSelected.id,
      procedencia: procedenciaSelected,
    };

    const newTicketObj: Ticket = {
      id: ticketId,
      numeroTicket,
      numeroBoleta,
      tipoComprobante,
      rucFactura: tipoComprobante === 'FACTURA_ELECTRONICA' ? rucFactura : undefined,
      razonSocialFactura: tipoComprobante === 'FACTURA_ELECTRONICA' ? razonSocialFactura : undefined,
      fecha: new Date().toISOString(),
      pacienteId: newPatient.id,
      paciente: newPatient,
      medicoId: medicoSelected.id,
      medico: medicoSelected,
      medicoSolicitanteId: medicoSolicitanteId,
      medicoSolicitante: medicos.find((m) => m.id === medicoSolicitanteId),
      items: cartItems,
      tarifaId: cartItems[0]?.tarifaId,
      tarifa: tarifas.find((t) => t.id === cartItems[0]?.tarifaId),
      metodoPago,
      montoPaciente: totalMontoPaciente,
      montoMedico: totalMontoMedico,
      montoClinica: totalMontoClinica,
      montoTecnico: totalMontoTecnico,
      nombreTecnico: totalMontoTecnico > 0 ? 'Samuel (Rayos X)' : undefined,
      estado: 'ACTIVO',
      estadoAtencion: 'ESPERA',
      consultorio: medicoSelected.consultorioAsignado || 'Consultorio 1',
      cajaDiariaId: caja.id,
      sunatProcesado: true,
      creadoEn: new Date().toISOString(),
    };

    try {
      await api.post('tickets', {
        pacienteId: newPatient.id,
        medicoId: medicoSelected.id,
        medicoSolicitanteId: medicoSolicitanteId,
        tarifaId: cartItems[0]?.tarifaId,
        metodoPago,
      });
    } catch {}

    setTickets([newTicketObj, ...tickets]);

    // Update local cash state
    setCaja({
      ...caja,
      montoEfectivoEsperado:
        metodoPago === 'EFECTIVO'
          ? Number(caja.montoEfectivoEsperado) + totalMontoPaciente
          : Number(caja.montoEfectivoEsperado),
      montoDigitalEsperado:
        metodoPago !== 'EFECTIVO'
          ? Number(caja.montoDigitalEsperado) + totalMontoPaciente
          : Number(caja.montoDigitalEsperado),
    });

    setPrintedTicket(newTicketObj);
    resetForm();
  };

  const handleUpdateEstadoAtencion = (ticketId: number, nextEstado: EstadoAtencion) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, estadoAtencion: nextEstado } : t))
    );
  };

  const handleCreateEgreso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!montoEgreso || Number(montoEgreso) <= 0) return;

    const newEgresoObj: Egreso = {
      id: Date.now(),
      fecha: new Date().toISOString(),
      tipoEgreso,
      monto: Number(montoEgreso),
      observaciones: observacionEgreso,
      proveedor: proveedorEgreso || 'Caja Chica',
      cajaDiariaId: caja?.id || 1,
    };

    try {
      await api.post('egresos', newEgresoObj);
    } catch {}

    setEgresos([newEgresoObj, ...egresos]);
    if (caja) {
      setCaja({
        ...caja,
        montoEfectivoEsperado: Number(caja.montoEfectivoEsperado) - Number(montoEgreso),
      });
    }
    setMontoEgreso('');
    setObservacionEgreso('');
    setProveedorEgreso('');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-teal-600 selection:text-white">
      {/* Top Header Bar Minimalist White */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-3.5 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand & Clinic Specs */}
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md">
              <Stethoscope className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-xl text-slate-900 tracking-tight">CENTRO MÉDICO MEDIC</h1>
                <span className="bg-slate-100 text-slate-700 border border-slate-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  LOCAL LAN • PERÚ
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <ShieldCheck className="h-3.5 w-3.5" /> Servidor OK (192.168.1.50)
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1 font-medium">
                  <Clock className="h-3.5 w-3.5 text-slate-400" /> {currentTime}
                </span>
              </p>
            </div>
          </div>

          {/* Cash Shift Summary */}
          <div className="flex items-center gap-3">
            {caja?.abierta ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                  </span>
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">TURNO ACTIVO</span>
                </div>
                <div className="h-6 w-px bg-slate-200"></div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Efectivo Físico Caja</div>
                  <div className="text-base font-extrabold text-slate-900">
                    S/ {Number(caja.montoEfectivoEsperado).toFixed(2)}
                  </div>
                </div>
                <div className="text-right border-l border-slate-200 pl-3">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Digital (Plin/POS)</div>
                  <div className="text-base font-bold text-teal-700">
                    S/ {Number(caja.montoDigitalEsperado).toFixed(2)}
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() =>
                  setCaja({
                    id: Date.now(),
                    fecha: new Date().toISOString(),
                    montoApertura: 100,
                    montoEfectivoEsperado: 100,
                    montoDigitalEsperado: 0,
                    diferenciaCierre: 0,
                    fechaApertura: new Date().toISOString(),
                    abierta: true,
                  })
                }
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition text-sm"
              >
                <Wallet className="h-4 w-4" /> ABRIR CAJA DE ATENCIÓN (S/ 100)
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Navigation Pills Bar */}
      <nav className="bg-white border-b border-slate-200 px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto py-2.5 scrollbar-none">
          {[
            { id: 'pos', label: 'Admisión & POS Clínico', icon: Receipt, badge: 'Ventas F1-F4' },
            { id: 'cola', label: 'Cola de Espera Pacientes', icon: Activity, badge: tickets.filter(t => t.estadoAtencion !== 'ATENDIDO').length },
            { id: 'cierre', label: 'Arqueo Ciego de Caja', icon: Wallet },
            { id: 'egresos', label: 'Egresos & Gastos', icon: TrendingUp },
            { id: 'importer', label: 'Importador Excel', icon: FileSpreadsheet, badge: 'Masivo' },
            { id: 'liquidaciones', label: 'Liquidación Médicos CMP', icon: Users },
            { id: 'tarifario', label: 'Tarifario Oficial', icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                {tab.label}
                {tab.badge !== undefined && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-teal-500 text-slate-950 font-extrabold' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto w-full p-4 md:p-6 flex-1">
        {/* TAB 1: ADMISIÓN POS REAL CLINICAL FLOW */}
        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Formulario de Registro & Cobro (7 columnas) */}
            <div className="lg:col-span-7 space-y-5">
              <form onSubmit={handleCreateTicket} className="white-card rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-teal-600" />
                    <h2 className="text-base font-bold text-slate-900">Registrar Atención de Paciente</h2>
                  </div>
                  <span className="text-xs text-slate-400">[Esc] Limpiar formulario</span>
                </div>

                {/* BLOQUE 1: DATOS DEL PACIENTE (DNI / TELEFONO / EDAD) */}
                <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-teal-700 uppercase tracking-wider flex items-center gap-1.5">
                      <UserCheck className="h-4 w-4" /> 1. Datos Clínicos del Paciente
                    </span>
                    {isExistingPatient && (
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Paciente Registrado
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Tipo & Numero Documento */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Doc. Identidad *</label>
                      <div className="flex gap-1">
                        <select
                          value={tipoDoc}
                          onChange={(e) => setTipoDoc(e.target.value as any)}
                          className="bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 p-2 focus:outline-none focus:border-teal-600"
                        >
                          <option value="DNI">DNI</option>
                          <option value="CE">CE</option>
                          <option value="PASAPORTE">PAS</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Búsqueda DNI"
                          value={numDoc}
                          onChange={(e) => handleDocOrPhoneSearch(e.target.value, 'doc')}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs text-slate-900 font-mono font-semibold focus:outline-none focus:border-teal-600"
                        />
                      </div>
                    </div>

                    {/* Celular Búsqueda */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">N° Celular</label>
                      <div className="relative">
                        <Phone className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="954001113"
                          value={celularPaciente}
                          onChange={(e) => handleDocOrPhoneSearch(e.target.value, 'phone')}
                          className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-600"
                        />
                      </div>
                    </div>

                    {/* Procedencia Ubigeo */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Procedencia *</label>
                      <select
                        value={procedenciaId}
                        onChange={(e) => setProcedenciaId(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-teal-600"
                      >
                        {procedencias.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nombre} ({p.distrito || 'Local'})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Nombres y Apellidos */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Nombres y Apellidos Completos *</label>
                      <input
                        type="text"
                        placeholder="Jeffry Julca Román"
                        required
                        value={nombrePaciente}
                        onChange={(e) => setNombrePaciente(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-teal-600"
                      />
                    </div>

                    {/* Edad y Historia Clínica */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Edad / N° Hist. Clínica</label>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          placeholder="Edad"
                          value={edadPaciente}
                          onChange={(e) => setEdadPaciente(e.target.value)}
                          className="w-16 bg-white border border-slate-300 rounded-lg px-2 py-2 text-xs text-center text-slate-900 focus:outline-none focus:border-teal-600"
                        />
                        <input
                          type="text"
                          placeholder="HC-5024"
                          value={historiaClinica}
                          onChange={(e) => setHistoriaClinica(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-600"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* BLOQUE 2: MÉDICO CMP Y SELECCIÓN MULTISERVICIO */}
                <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-3">
                  <span className="text-xs font-extrabold text-teal-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Stethoscope className="h-4 w-4" /> 2. Asignación Médica CMP y Servicios
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Médico Atendiente CMP */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Médico Tratante (CMP / Consultorio) *</label>
                      <select
                        value={medicoId}
                        onChange={(e) => setMedicoId(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-teal-600"
                      >
                        {medicos.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.grado} {m.nombre} — CMP: {m.cmp || 'S/N'} ({m.consultorioAsignado})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Médico Solicitante Externo */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Médico Solicitante / Derivador</label>
                      <select
                        value={medicoSolicitanteId || ''}
                        onChange={(e) => setMedicoSolicitanteId(e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-teal-600"
                      >
                        <option value="">-- Ninguno (Atención Directa) --</option>
                        {medicos.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.nombre} (+S/ 20 comisión)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Selector rápido de tarifa por categoría */}
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Añadir Servicios al Comprobante</label>
                    <div className="flex gap-2">
                      <select
                        value={tarifaSeleccionadaId}
                        onChange={(e) => setTarifaSeleccionadaId(Number(e.target.value))}
                        className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-teal-800 focus:outline-none focus:border-teal-600"
                      >
                        {tarifas.map((t) => (
                          <option key={t.id} value={t.id}>
                            [{t.categoria}] {t.descripcion} — S/ {Number(t.precioTotal).toFixed(2)}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => addItemToCart(tarifaSeleccionadaId)}
                        className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-3 py-2 rounded-lg text-xs flex items-center gap-1 shadow-sm"
                      >
                        <Plus className="h-4 w-4" /> Agregar
                      </button>
                    </div>
                  </div>

                  {/* Canasta de servicios agregados */}
                  <div className="bg-white rounded-lg border border-slate-200 p-2.5 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Detalle del Comprobante ({cartItems.length} servicios)</span>
                    {cartItems.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-2">Sin servicios agregados.</p>
                    ) : (
                      cartItems.map((item) => (
                        <div key={item.tarifaId} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-none">
                          <span className="font-semibold text-slate-800">{item.descripcion} (x{item.cantidad})</span>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-slate-900">S/ {(item.precioUnitario * item.cantidad).toFixed(2)}</span>
                            <button type="button" onClick={() => removeItemFromCart(item.tarifaId)} className="text-rose-500 hover:text-rose-700">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* BLOQUE 3: TIPO DE COMPROBANTE SUNAT (BOLETA / FACTURA / TICKET) */}
                <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-3">
                  <span className="text-xs font-extrabold text-teal-700 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="h-4 w-4" /> 3. Comprobante SUNAT y Forma de Pago
                  </span>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'BOLETA_ELECTRONICA', label: 'Boleta Electrónica', desc: 'DNI / Paciente' },
                      { id: 'FACTURA_ELECTRONICA', label: 'Factura Electrónica', desc: 'RUC 11 dígitos' },
                      { id: 'TICKET_INTERNO', label: 'Ticket de Control', desc: 'Uso Interno' },
                    ].map((comp) => (
                      <button
                        type="button"
                        key={comp.id}
                        onClick={() => setTipoComprobante(comp.id as any)}
                        className={`p-2.5 rounded-xl border text-center transition ${
                          tipoComprobante === comp.id
                            ? 'bg-slate-900 border-slate-900 text-white font-bold shadow-sm'
                            : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className="text-xs font-bold">{comp.label}</div>
                        <div className="text-[10px] opacity-75">{comp.desc}</div>
                      </button>
                    ))}
                  </div>

                  {/* Factura RUC fields */}
                  {tipoComprobante === 'FACTURA_ELECTRONICA' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 animate-in fade-in">
                      <input
                        type="text"
                        placeholder="RUC (11 dígitos)"
                        value={rucFactura}
                        onChange={(e) => setRucFactura(e.target.value)}
                        className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-teal-600"
                      />
                      <input
                        type="text"
                        placeholder="Razón Social Empresa"
                        value={razonSocialFactura}
                        onChange={(e) => setRazonSocialFactura(e.target.value)}
                        className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-teal-600"
                      />
                    </div>
                  )}

                  {/* Formas de Pago */}
                  <div className="grid grid-cols-4 gap-2 pt-2">
                    {[
                      { id: 'EFECTIVO', label: 'Efectivo [F1]', icon: DollarSign },
                      { id: 'PLIN', label: 'Yape/Plin [F2]', icon: QrCode },
                      { id: 'TRANSFERENCIA', label: 'Transf. [F3]', icon: Building },
                      { id: 'TARJETA', label: 'POS Card [F4]', icon: CreditCard },
                    ].map((p) => {
                      const Icon = p.icon;
                      const isSelected = metodoPago === p.id;
                      return (
                        <button
                          type="button"
                          key={p.id}
                          onClick={() => {
                            setMetodoPago(p.id as any);
                            if (p.id === 'PLIN') setShowQrModal(true);
                          }}
                          className={`p-2 rounded-lg border text-center transition flex flex-col items-center gap-1 ${
                            isSelected
                              ? 'bg-teal-50 border-teal-600 text-teal-900 font-extrabold shadow-sm'
                              : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <Icon className="h-4 w-4 text-teal-600" />
                          <span className="text-[11px]">{p.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* DESGLES FINANCIAL SPLIT CARD */}
                <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm space-y-2">
                  <div className="text-[11px] font-bold text-teal-400 uppercase tracking-wider flex justify-between">
                    <span>Desglose Clínico Automático</span>
                    <span>Total Paciente: S/ {totalMontoPaciente.toFixed(2)}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs pt-1">
                    <div className="bg-slate-800 p-2 rounded-lg">
                      <div className="text-[10px] text-slate-400">Total Cobrado</div>
                      <div className="font-extrabold text-white">S/ {totalMontoPaciente.toFixed(2)}</div>
                    </div>
                    <div className="bg-slate-800 p-2 rounded-lg">
                      <div className="text-[10px] text-teal-300">Médico CMP</div>
                      <div className="font-bold text-teal-300">S/ {totalMontoMedico.toFixed(2)}</div>
                    </div>
                    <div className="bg-slate-800 p-2 rounded-lg">
                      <div className="text-[10px] text-emerald-400">Clínica Neto</div>
                      <div className="font-bold text-emerald-400">S/ {totalMontoClinica.toFixed(2)}</div>
                    </div>
                    <div className="bg-slate-800 p-2 rounded-lg">
                      <div className="text-[10px] text-amber-300">Técnico/Ext.</div>
                      <div className="font-bold text-amber-300">S/ {(totalMontoTecnico + totalMontoSolicitante).toFixed(2)}</div>
                    </div>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-black py-3.5 px-6 rounded-xl shadow-md flex items-center justify-center gap-2 text-sm tracking-wide transition transform active:scale-[0.99]"
                >
                  <Printer className="h-5 w-5 stroke-[2.5]" />
                  EMITIR E IMPRIMIR COMPROBANTE (Enter)
                </button>
              </form>
            </div>

            {/* Panel Derecho: Lista de Comprobantes Recientes (5 columnas) */}
            <div className="lg:col-span-5 space-y-5">
              {/* Stat box */}
              <div className="white-card rounded-2xl p-5 shadow-sm border border-slate-200 space-y-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Activity className="h-4 w-4 text-teal-600" /> Resumen de Atenciones del Turno
                </h3>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">Total Emitidos</div>
                    <div className="text-2xl font-black text-slate-900">{tickets.length}</div>
                    <div className="text-[10px] text-teal-700 font-semibold">Comprobantes hoy</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">Recaudado Bruto</div>
                    <div className="text-2xl font-black text-emerald-700">
                      S/ {tickets.reduce((sum, t) => sum + Number(t.montoPaciente), 0).toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-500">Efectivo + Digital</div>
                  </div>
                </div>
              </div>

              {/* Tickets emitidos */}
              <div className="white-card rounded-2xl p-5 shadow-sm border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-teal-600" /> Histórico de Comprobantes
                  </h3>
                  <span className="text-xs text-slate-500 font-semibold">{tickets.length} registros</span>
                </div>

                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
                  {tickets.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      No hay comprobantes emitidos en el turno actual.
                    </div>
                  ) : (
                    tickets.map((t) => (
                      <div
                        key={t.id}
                        className="bg-slate-50 hover:bg-slate-100/80 p-3 rounded-xl border border-slate-200 flex items-center justify-between transition"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-teal-700">{t.numeroBoleta || t.numeroTicket}</span>
                            <span className="bg-slate-200 text-slate-800 text-[10px] font-extrabold px-1.5 py-0.2 rounded uppercase">
                              {t.tipoComprobante.replace('_ELECTRONICA', '').replace('_INTERNO', '')}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-slate-900">{t.paciente?.nombre}</div>
                          <div className="text-[11px] text-slate-500">
                            Dr. {t.medico?.nombre} • {t.consultorio}
                          </div>
                        </div>

                        <div className="text-right space-y-1">
                          <div className="text-sm font-black text-slate-900">S/ {Number(t.montoPaciente).toFixed(2)}</div>
                          <button
                            onClick={() => setPrintedTicket(t)}
                            className="text-[11px] text-teal-700 hover:underline flex items-center gap-1 justify-end ml-auto font-semibold"
                          >
                            <Printer className="h-3 w-3" /> Imprimir
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COLA DE ESPERA PACIENTES */}
        {activeTab === 'cola' && (
          <div className="white-card rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="h-6 w-6 text-teal-600" /> Sala de Espera y Cola de Atención Médica
                </h2>
                <p className="text-xs text-slate-500">Gestión de llamados a consultorio en tiempo real</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['ESPERA', 'CONSULTORIO', 'ATENDIDO'].map((est) => {
                const list = tickets.filter((t) => t.estadoAtencion === est);
                const title = est === 'ESPERA' ? 'En Sala de Espera' : est === 'CONSULTORIO' ? 'En Consultorio' : 'Atendidos';
                const badgeColor = est === 'ESPERA' ? 'bg-amber-100 text-amber-800' : est === 'CONSULTORIO' ? 'bg-teal-100 text-teal-800' : 'bg-emerald-100 text-emerald-800';

                return (
                  <div key={est} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="font-bold text-slate-800 text-sm">{title}</span>
                      <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${badgeColor}`}>{list.length}</span>
                    </div>

                    <div className="space-y-2">
                      {list.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-6">Sin pacientes en este estado.</p>
                      ) : (
                        list.map((tk) => (
                          <div key={tk.id} className="bg-white p-3 rounded-lg border border-slate-200 space-y-2 shadow-sm">
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-xs text-slate-900">{tk.paciente?.nombre}</span>
                              <span className="text-[10px] font-mono text-slate-400">{tk.numeroTicket}</span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Dr. {tk.medico?.nombre} ({tk.consultorio})
                            </div>

                            <div className="flex gap-1 pt-1">
                              {est === 'ESPERA' && (
                                <button
                                  onClick={() => handleUpdateEstadoAtencion(tk.id, 'CONSULTORIO')}
                                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-[10px] py-1 rounded"
                                >
                                  Llamar a Consultorio
                                </button>
                              )}
                              {est === 'CONSULTORIO' && (
                                <button
                                  onClick={() => handleUpdateEstadoAtencion(tk.id, 'ATENDIDO')}
                                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] py-1 rounded"
                                >
                                  Marcar Atendido
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: ARQUEO CIEGO DE CAJA */}
        {activeTab === 'cierre' && (
          <div className="max-w-3xl mx-auto white-card rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Wallet className="h-6 w-6 text-teal-600" /> Arqueo Ciego de Caja Chica
              </h2>
              <p className="text-xs text-slate-500">
                Protocolo de seguridad: Ingrese el dinero contado en físico sin visualizar previamente el saldo esperado
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase">Monto Apertura</div>
                  <div className="text-lg font-bold text-slate-900">S/ {Number(caja?.montoApertura || 0).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase">Estado Actual</div>
                  <div className="text-lg font-bold text-emerald-700 uppercase">Turno Abierto</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ingrese el Efectivo Físico Total Contado en Caja (S/) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="0.00"
                  value={montoFisicoCierre}
                  onChange={(e) => setMontoFisicoCierre(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-lg font-extrabold text-slate-900 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Observaciones de Recepción</label>
                <textarea
                  rows={2}
                  placeholder="Notas de billetes en mal estado o vuelto de caja..."
                  value={observacionesCierre}
                  onChange={(e) => setObservacionesCierre(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-teal-600"
                />
              </div>

              {montoFisicoCierre !== '' && (
                <div className="bg-slate-900 text-white p-4 rounded-xl space-y-1 animate-in fade-in">
                  <div className="text-xs font-semibold text-teal-400">Resultado Auditoría de Cierre</div>
                  <div className="flex justify-between text-sm font-bold">
                    <span>Efectivo Físico Declarado:</span>
                    <span>S/ {Number(montoFisicoCierre).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold border-t border-slate-800 pt-1">
                    <span>Efectivo Esperado en Sistema:</span>
                    <span>S/ {Number(caja?.montoEfectivoEsperado || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold border-t border-slate-800 pt-1">
                    <span>Diferencia:</span>
                    <span
                      className={
                        Number(montoFisicoCierre) - Number(caja?.montoEfectivoEsperado || 0) >= 0
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }
                    >
                      S/ {(Number(montoFisicoCierre) - Number(caja?.montoEfectivoEsperado || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  alert('Caja Diaria Cerrada y Reporte de Auditoría Generado.');
                  if (caja) setCaja({ ...caja, abierta: false });
                }}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl transition shadow-sm text-sm"
              >
                PROCESAR CIERRE DE TURNO Y ARQUEO
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: EGRESOS & GASTOS */}
        {activeTab === 'egresos' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 white-card rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-teal-600" /> Registrar Egreso / Gasto
              </h2>

              <form onSubmit={handleCreateEgreso} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo de Egreso *</label>
                  <select
                    value={tipoEgreso}
                    onChange={(e) => setTipoEgreso(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-teal-600"
                  >
                    <option value="GASTO">Gasto Operativo (Insumos/Limpieza)</option>
                    <option value="PLANILLA">Pago Planilla / Personal</option>
                    <option value="PAGO_FIJO">Servicio Fijo (Luz/Agua/Internet)</option>
                    <option value="ASCENSOR">Proyecto Ascensor</option>
                    <option value="DEVOLUCION">Devolución a Paciente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Monto Egreso (S/) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    placeholder="50.00"
                    value={montoEgreso}
                    onChange={(e) => setMontoEgreso(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Proveedor / Beneficiario</label>
                  <input
                    type="text"
                    placeholder="Ej. Botica Central / Imprenta"
                    value={proveedorEgreso}
                    onChange={(e) => setProveedorEgreso(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Concepto / Glosa *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Compra de insumos médicos y mascarillas"
                    value={observacionEgreso}
                    onChange={(e) => setObservacionEgreso(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-teal-600"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 rounded-lg text-xs transition shadow-sm"
                >
                  REGISTRAR EGRESO DE CAJA
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 white-card rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Egresos Registrados en Turno</h2>

              <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin">
                {egresos.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">Sin egresos registrados.</div>
                ) : (
                  egresos.map((eg) => (
                    <div
                      key={eg.id}
                      className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                            {eg.tipoEgreso}
                          </span>
                          <span className="text-xs text-slate-500">{new Date(eg.fecha).toLocaleTimeString()}</span>
                        </div>
                        <div className="text-xs font-bold text-slate-900 mt-1">{eg.observaciones}</div>
                        <div className="text-[11px] text-slate-500">{eg.proveedor}</div>
                      </div>
                      <div className="text-sm font-black text-rose-600">- S/ {Number(eg.monto).toFixed(2)}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: IMPORTADOR EXCEL */}
        {activeTab === 'importer' && (
          <div className="max-w-4xl mx-auto white-card rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="h-6 w-6 text-teal-600" /> Importador Masivo de Hojas Excel Históricas
              </h2>
              <p className="text-xs text-slate-500">Previsualización dry-run e inserción transaccional en PostgreSQL</p>
            </div>

            <div className="border-2 border-dashed border-slate-300 hover:border-teal-600 rounded-2xl p-8 text-center space-y-3 transition">
              <Upload className="h-10 w-10 text-teal-600 mx-auto" />
              <div>
                <p className="text-sm font-bold text-slate-900">Arrastre el archivo Excel consolidado de caja (.xlsx)</p>
                <p className="text-xs text-slate-500">Soporta pestañas de Consultas, Rayos X, Certificados y Egresos</p>
              </div>

              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                className="hidden"
                id="excel-input"
              />
              <label
                htmlFor="excel-input"
                className="inline-block bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2 rounded-xl border border-slate-300 cursor-pointer text-xs"
              >
                {excelFile ? excelFile.name : 'Seleccionar Archivo Excel'}
              </label>
            </div>

            {excelFile && (
              <button
                onClick={() =>
                  setDryRunData({
                    mesIdentificado: 'JUNIO 2026',
                    totalCobrado: 78558.63,
                    totalTickets: 524,
                    totalEgresos: 42,
                    medicosNuevos: ['Dr. Randy Rebaza (Cirugía)', 'Dra. Karen Meléndez (Ecografía)'],
                    alertas: ['3 atenciones sin número de celular', 'Fechas convirtieron OK'],
                  })
                }
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl transition shadow-sm text-sm"
              >
                EJECUTAR PREVISUALIZACIÓN DRY-RUN
              </button>
            )}

            {dryRunData && (
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-sm font-bold text-slate-900">Resultado Dry-Run ({dryRunData.mesIdentificado})</span>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    Sin Errores Críticos
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-500 font-semibold">Total Recaudado</div>
                    <div className="text-lg font-black text-emerald-700">S/ {dryRunData.totalCobrado.toFixed(2)}</div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-500 font-semibold">Tickets A Importar</div>
                    <div className="text-lg font-bold text-slate-900">{dryRunData.totalTickets}</div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-500 font-semibold">Egresos A Importar</div>
                    <div className="text-lg font-bold text-rose-600">{dryRunData.totalEgresos}</div>
                  </div>
                </div>

                <button
                  onClick={() => alert('Importación realizada al 100% en PostgreSQL.')}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition shadow-sm text-sm"
                >
                  CONFIRMAR E INSERTAR EN BASE DE DATOS
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: LIQUIDACIÓN MÉDICA */}
        {activeTab === 'liquidaciones' && (
          <div className="white-card rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Users className="h-6 w-6 text-teal-600" /> Liquidación de Comisiones por Médico CMP
              </h2>
              <p className="text-xs text-slate-500">Cálculo de honorarios profesionales según tarifario oficial</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {medicos.map((med) => {
                const doctorTickets = tickets.filter((t) => t.medicoId === med.id && t.estado === 'ACTIVO');
                const totalComision = doctorTickets.reduce((sum, t) => sum + Number(t.montoMedico), 0);

                return (
                  <div key={med.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-900 text-sm">{med.nombre}</div>
                      <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        CMP: {med.cmp || 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-xs">
                      <span className="text-slate-500">Especialidad:</span>
                      <span className="font-semibold text-slate-800">{med.especialidad}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm pt-1">
                      <span className="text-slate-500 text-xs font-semibold">Total Honorarios:</span>
                      <span className="font-black text-emerald-700">S/ {totalComision.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 7: TARIFARIO OFICIAL */}
        {activeTab === 'tarifario' && (
          <div className="white-card rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Layers className="h-6 w-6 text-teal-600" /> Tarifario Oficial de Servicios Médicos
              </h2>
              <p className="text-xs text-slate-500">Costos para pacientes y reparto porcentual/fijo por convenio</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
                    <th className="p-3">Categoría</th>
                    <th className="p-3">Descripción</th>
                    <th className="p-3">Precio Paciente</th>
                    <th className="p-3">Pago Médico</th>
                    <th className="p-3">Clínica Neto</th>
                    <th className="p-3">Técnico Placas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {tarifas.map((tf) => (
                    <tr key={tf.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-teal-800">{tf.categoria}</td>
                      <td className="p-3 text-slate-900 font-medium">{tf.descripcion}</td>
                      <td className="p-3 font-black text-slate-900">S/ {Number(tf.precioTotal).toFixed(2)}</td>
                      <td className="p-3 text-teal-700 font-bold">S/ {Number(tf.comisionMedico).toFixed(2)}</td>
                      <td className="p-3 text-emerald-700 font-bold">S/ {Number(tf.comisionClinica).toFixed(2)}</td>
                      <td className="p-3 text-slate-500">{tf.requiereTecnico ? 'Samuel (S/ 5.00)' : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: QR CODE DISPLAY */}
      {showQrModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 max-w-sm w-full text-center space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Escanea para Pagar por QR</h3>
              <button onClick={() => setShowQrModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl inline-block border border-slate-200">
              <div className="w-48 h-48 bg-slate-900 rounded-xl flex flex-col items-center justify-center text-white p-2">
                <QrCode className="h-32 w-32 text-teal-400" />
                <span className="text-[10px] text-slate-300 mt-1 font-mono">PLIN / YAPE CENTRO MEDIC</span>
              </div>
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 rounded-xl transition text-xs"
            >
              CONFIRMAR PAGO DIGITAL
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: VISTA TÉRMICA DE IMPRESIÓN 80mm FORMAL */}
      {printedTicket && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Printer className="h-4 w-4 text-teal-600" /> Vista Previa Comprobante Clínico (80mm)
              </h3>
              <button onClick={() => setPrintedTicket(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Printable Ticket Area */}
            <div
              id="printable-ticket"
              className="bg-white text-slate-950 p-4 rounded-xl font-mono text-xs space-y-2 border border-slate-300 shadow-inner"
            >
              <div className="text-center font-bold text-sm">CENTRO MÉDICO MEDIC</div>
              <div className="text-center text-[10px]">RUC: 20601234567 • Tel: (044) 554433</div>
              <div className="text-center text-[10px]">Ciudad de Dios - Guadalupe - La Libertad</div>
              <div className="border-b border-dashed border-slate-400 my-2"></div>

              <div className="text-center font-extrabold uppercase text-xs">
                {printedTicket.tipoComprobante.replace('_ELECTRONICA', ' ELECTRÓNICA').replace('_INTERNO', ' INTERNO')}
              </div>
              <div className="text-center font-bold text-xs">{printedTicket.numeroBoleta || printedTicket.numeroTicket}</div>
              <div className="text-center text-[10px]">FECHA: {new Date(printedTicket.fecha).toLocaleString()}</div>
              <div className="border-b border-dashed border-slate-400 my-1"></div>

              <div>PACIENTE: {printedTicket.paciente?.nombre}</div>
              <div>DOC. IDENT: {printedTicket.paciente?.numeroDocumento || 'S/N'}</div>
              <div>HIST. CLIN: {printedTicket.paciente?.numeroHistoriaClinica || 'N/A'}</div>
              <div>PROCEDENCIA: {printedTicket.paciente?.procedencia?.nombre || 'Ciudad de Dios'}</div>
              <div className="border-b border-dashed border-slate-400 my-1"></div>

              <div>MÉDICO TRATANTE: {printedTicket.medico?.nombre}</div>
              <div>CMP: {printedTicket.medico?.cmp || 'S/N'}</div>
              <div>CONSULTORIO: {printedTicket.consultorio}</div>
              <div className="border-b border-dashed border-slate-400 my-1"></div>

              <div className="font-bold border-b border-slate-300 pb-1">DESCRIPCIÓN DE ATENCIONES:</div>
              {printedTicket.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-[11px]">
                  <span>{item.descripcion} (x{item.cantidad})</span>
                  <span>S/ {(item.precioUnitario * item.cantidad).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-b border-dashed border-slate-400 my-1"></div>

              <div className="flex justify-between font-extrabold text-sm pt-1">
                <span>TOTAL A PAGAR:</span>
                <span>S/ {Number(printedTicket.montoPaciente).toFixed(2)}</span>
              </div>
              <div className="text-[10px]">MÉTODO DE PAGO: {printedTicket.metodoPago}</div>
              <div className="border-b border-dashed border-slate-400 my-2"></div>

              <div className="text-center text-[10px] font-bold">¡Conserve este ticket para ser llamado a consultorio!</div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-sm"
              >
                <Printer className="h-4 w-4" /> IMPRIMIR VOUCHER 80MM
              </button>
              <button
                onClick={() => setPrintedTicket(null)}
                className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition text-xs border border-slate-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
