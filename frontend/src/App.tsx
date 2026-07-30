import React, { useEffect, useState } from 'react';
import {
  Stethoscope,
  Receipt,
  UserCheck,
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
  UserPlus,
  Settings,
  Pencil,
  Save,
  X,
  AlertTriangle
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

type TabType = 'pos' | 'cola' | 'cierre' | 'egresos' | 'importer' | 'liquidaciones' | 'tarifario' | 'admin';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('pos');

  // Master Data
  const [procedencias, setProcedencias] = useState<Procedencia[]>(INITIAL_PROCEDENCIAS);
  const [medicos, setMedicos] = useState<Medico[]>(INITIAL_MEDICOS);
  const [tarifas, setTarifas] = useState<Tarifa[]>(INITIAL_TARIFAS);
  const [caja, setCaja] = useState<CajaDiaria | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [egresos, setEgresos] = useState<Egreso[]>([]);

  // POS Patient Form State
  const [tipoDoc, setTipoDoc] = useState<'DNI' | 'CE' | 'PASAPORTE'>('DNI');
  const [numDoc, setNumDoc] = useState('');
  const [celularPaciente, setCelularPaciente] = useState('');
  const [nombrePaciente, setNombrePaciente] = useState('');
  const [edadPaciente, setEdadPaciente] = useState('');
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
  const [importing, setImporting] = useState(false);

  // Admin Panel State
  const [editingMedicoId, setEditingMedicoId] = useState<number | null>(null);
  const [editingMedicoData, setEditingMedicoData] = useState<Partial<Medico>>({});
  const [editingTarifaId, setEditingTarifaId] = useState<number | null>(null);
  const [editingTarifaData, setEditingTarifaData] = useState<Partial<Tarifa>>({});
  const [editingProcId, setEditingProcId] = useState<number | null>(null);
  const [editingProcData, setEditingProcData] = useState<Partial<Procedencia>>({});
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminSuccess, setAdminSuccess] = useState<string | null>(null);

  // History Modal & Filter State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyDoctorFilter, setHistoryDoctorFilter] = useState('');
  const [historyDateFrom, setHistoryDateFrom] = useState('');
  const [historyDateTo, setHistoryDateTo] = useState('');
  const [historyPaymentFilter, setHistoryPaymentFilter] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('');
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);

  // Liquidaciones Filters State
  const [liqSearch, setLiqSearch] = useState('');
  const [liqSpecialty, setLiqSpecialty] = useState('');
  const [liqDateFrom, setLiqDateFrom] = useState('');
  const [liqDateTo, setLiqDateTo] = useState('');

  // Tarifario Filters State
  const [tarSearch, setTarSearch] = useState('');
  const [tarCategory, setTarCategory] = useState('');

  const handleAnularTicket = async (ticketId: number) => {
    if (!window.confirm('¿Está seguro de anular este comprobante? Esta acción registrará el ticket como ANULADO.')) return;
    try {
      await api.delete(`tickets/${ticketId}`);
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, estado: 'ANULADO' } : t));
      alert('Comprobante anulado con éxito.');
    } catch (err: any) {
      console.error('Error al anular ticket:', err);
      alert('No se pudo anular el comprobante.');
    }
  };

  const handleSaveMedico = async (id: number) => {
    setAdminSaving(true); setAdminError(null);
    try {
      const updated = await api.patch<Medico>(`medicos/${id}`, editingMedicoData);
      setMedicos(prev => prev.map(m => m.id === id ? { ...m, ...updated } : m));
      setEditingMedicoId(null);
      setAdminSuccess('Médico actualizado correctamente.');
      setTimeout(() => setAdminSuccess(null), 3000);
    } catch { setAdminError('No se pudo guardar. Verifica la conexión con el servidor.'); }
    finally { setAdminSaving(false); }
  };

  const handleDeleteMedico = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este médico? Esta acción no se puede deshacer.')) return;
    setAdminSaving(true); setAdminError(null);
    try {
      await api.delete(`medicos/${id}`);
      setMedicos(prev => prev.filter(m => m.id !== id));
      setAdminSuccess('Médico eliminado.');
      setTimeout(() => setAdminSuccess(null), 3000);
    } catch { setAdminError('No se puede eliminar: el médico tiene atenciones registradas en el sistema.'); }
    finally { setAdminSaving(false); }
  };

  const handleSaveTarifa = async (id: number) => {
    setAdminSaving(true); setAdminError(null);
    try {
      const updated = await api.patch<Tarifa>(`tarifas/${id}`, editingTarifaData);
      setTarifas(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t));
      setEditingTarifaId(null);
      setAdminSuccess('Tarifa actualizada correctamente.');
      setTimeout(() => setAdminSuccess(null), 3000);
    } catch { setAdminError('No se pudo guardar la tarifa.'); }
    finally { setAdminSaving(false); }
  };

  const handleSaveProc = async (id: number) => {
    setAdminSaving(true); setAdminError(null);
    try {
      const updated = await api.patch<Procedencia>(`procedencias/${id}`, editingProcData);
      setProcedencias(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
      setEditingProcId(null);
      setAdminSuccess('Procedencia actualizada correctamente.');
      setTimeout(() => setAdminSuccess(null), 3000);
    } catch { setAdminError('No se pudo guardar la procedencia.'); }
    finally { setAdminSaving(false); }
  };

  const handleDeleteProc = async (id: number) => {
    if (!window.confirm('¿Eliminar esta procedencia? Solo es posible si no tiene pacientes asociados.')) return;
    setAdminSaving(true); setAdminError(null);
    try {
      await api.delete(`procedencias/${id}`);
      setProcedencias(prev => prev.filter(p => p.id !== id));
      setAdminSuccess('Procedencia eliminada.');
      setTimeout(() => setAdminSuccess(null), 3000);
    } catch { setAdminError('No se puede eliminar: la procedencia tiene pacientes registrados.'); }
    finally { setAdminSaving(false); }
  };

  const handleDryRun = async () => {
    if (!excelFile) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', excelFile);
      const response = await fetch('http://localhost:3000/importar/excel?dryRun=true', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Error al procesar el archivo Excel.');
      }
      const data = await response.json();
      setDryRunData(data.summary);
    } catch (error: any) {
      alert(error.message || 'Error al procesar el archivo.');
    } finally {
      setImporting(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!excelFile) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', excelFile);
      const response = await fetch('http://localhost:3000/importar/excel?dryRun=false', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Error al guardar los datos en base de datos.');
      }
      alert('Importación realizada al 100% en PostgreSQL.');
      setExcelFile(null);
      setDryRunData(null);
      loadAllData();
    } catch (error: any) {
      alert(error.message || 'Error al guardar los datos.');
    } finally {
      setImporting(false);
    }
  };

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

  const loadAllData = async () => {
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

  const handleOpenCaja = async () => {
    try {
      const newCaja = await api.post<CajaDiaria>('cajas-diarias', { montoApertura: 100 });
      setCaja(newCaja);
      alert('Caja Diaria abierta en el servidor.');
    } catch (err: any) {
      console.error('Error al abrir caja:', err);
      alert(`No se pudo abrir la caja en el servidor. Asegúrate de que el backend esté ejecutándose.`);
    }
  };

  const handleCloseCaja = async () => {
    if (!caja) return;
    
    const confirmacion = window.confirm(
      'Al usted presionar este botón se cerrará la caja del día y ya no se podrá abrir hasta el otro día. Si se requiere volver a abrir caja hoy, se creará una caja aparte.\n\n¿Está seguro de continuar con el cierre?'
    );
    if (!confirmacion) return;

    try {
      const montoReal = Number(montoFisicoCierre) || 0;
      await api.post(`cajas-diarias/${caja.id}/close`, {
        montoReal,
        observaciones: observacionesCierre,
      });
      setCaja({ ...caja, abierta: false });
      setMontoFisicoCierre('');
      setObservacionesCierre('');
      alert('Caja Diaria Cerrada y Reporte de Auditoría Generado en el servidor.');
    } catch (err: any) {
      console.error('Error al cerrar caja:', err);
      alert(`No se pudo cerrar la caja en el servidor.`);
    }
  };

  // Load backend data if available
  useEffect(() => {
    loadAllData();
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
        // Búsqueda en API externa de DNI si tiene 8 dígitos
        if (field === 'doc' && term.length === 8) {
          fetch(`http://localhost:3000/consultas/dni/${term}`)
            .then((res) => res.json())
            .then((resData) => {
              if (resData.success && resData.data) {
                const fullName = `${resData.data.nombres} ${resData.data.apellidoPaterno} ${resData.data.apellidoMaterno}`;
                setNombrePaciente(fullName);
              }
            })
            .catch((err) => console.error('Error fetching DNI:', err));
        }
      }
    }
  };

  const handleRucSearch = (val: string) => {
    setRucFactura(val);
    const term = val.trim();
    if (term.length === 11) {
      setRazonSocialFactura('Buscando Razón Social...');
      fetch(`http://localhost:3000/consultas/ruc/${term}`)
        .then((res) => res.json())
        .then((resData) => {
          if (resData.success && resData.data) {
            setRazonSocialFactura(resData.data.nombre_o_razon_social);
          } else {
            setRazonSocialFactura('No encontrado.');
          }
        })
        .catch((err) => {
          console.error('Error fetching RUC:', err);
          setRazonSocialFactura('Error en búsqueda.');
        });
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
      alert('No hay caja diaria abierta. Abre la caja antes de registrar comprobantes.');
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

    try {
      // PASO 1: Buscar si el paciente ya existe (por DNI o celular) o crear uno nuevo en la BD
      let savedPatient: Paciente;

      if (isExistingPatient) {
        // Paciente ya existe en local state (fue encontrado por búsqueda)
        const existingInTickets = tickets.find(
          (t) =>
            (numDoc && t.paciente?.numeroDocumento === numDoc) ||
            (celularPaciente && t.paciente?.celular === celularPaciente)
        );
        if (existingInTickets?.paciente) {
          savedPatient = existingInTickets.paciente;
        } else {
          // Crear en BD de todas formas si no encontramos el ID real
          savedPatient = await api.post<Paciente>('pacientes', {
            nombre: nombrePaciente,
            celular: celularPaciente || undefined,
            numeroHistoriaClinica: historiaClinica || undefined,
            procedenciaId: procedenciaSelected.id,
          });
        }
      } else {
        // Paciente nuevo: crear en la base de datos
        savedPatient = await api.post<Paciente>('pacientes', {
          nombre: nombrePaciente,
          celular: celularPaciente || undefined,
          numeroHistoriaClinica: historiaClinica || undefined,
          procedenciaId: procedenciaSelected.id,
        });
      }

      // PASO 2: Crear el ticket en la base de datos con el ID real del paciente
      const savedTicket = await api.post<Ticket>('tickets', {
        pacienteId: savedPatient.id,
        medicoId: medicoSelected.id,
        medicoSolicitanteId: medicoSolicitanteId,
        tarifaId: cartItems[0]?.tarifaId,
        metodoPago,
        descripcionAdicional: cartItems.map(i => i.descripcion).join(', '),
      });

      // PASO 3: Construir el objeto local enriquecido con datos que el backend no devuelve directamente
      const enrichedTicket: Ticket = {
        ...savedTicket,
        tipoComprobante: tipoComprobante,
        numeroBoleta:
          tipoComprobante === 'BOLETA_ELECTRONICA'
            ? `B001-${String(tickets.length + 101).padStart(8, '0')}`
            : tipoComprobante === 'FACTURA_ELECTRONICA'
            ? `F001-${String(tickets.length + 51).padStart(8, '0')}`
            : undefined,
        rucFactura: tipoComprobante === 'FACTURA_ELECTRONICA' ? rucFactura : undefined,
        razonSocialFactura: tipoComprobante === 'FACTURA_ELECTRONICA' ? razonSocialFactura : undefined,
        paciente: { ...savedPatient, procedencia: procedenciaSelected },
        medico: medicoSelected,
        medicoSolicitante: medicos.find((m) => m.id === medicoSolicitanteId),
        items: cartItems,
        estadoAtencion: 'ESPERA',
        consultorio: medicoSelected.consultorioAsignado || 'Consultorio 1',
        sunatProcesado: false,
        creadoEn: new Date().toISOString(),
      };

      setTickets([enrichedTicket, ...tickets]);

      // Actualizar saldo de caja local
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

      setPrintedTicket(enrichedTicket);
      resetForm();

    } catch (err: any) {
      console.error('Error al registrar atención:', err);
      alert(`Error al guardar en la base de datos: ${err?.message || 'Verifica que el servidor esté activo.'}`);
    }
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
    <div className="min-h-screen bg-[#fafafa] text-zinc-950 flex flex-row font-sans selection:bg-zinc-900 selection:text-white">
      {/* Left Sidebar Menu */}
      <aside className="w-64 shrink-0 bg-white border-r border-zinc-200 flex flex-col z-30 h-screen sticky top-0">
        {/* Brand Header */}
        <div className="p-5 border-b border-zinc-200 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-zinc-900 text-zinc-50 flex items-center justify-center">
            <Stethoscope className="h-5 w-5 stroke-[2]" />
          </div>
          <div>
            <h1 className="font-semibold text-sm text-zinc-900 tracking-tight">Centro Médico</h1>
            <span className="bg-zinc-100 text-zinc-800 border border-zinc-200 text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider block mt-0.5 max-w-max">
              Local LAN • Perú
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {[
            { id: 'pos', label: 'Admisión & POS', icon: Receipt, badge: 'F1-F4' },
            { id: 'cola', label: 'Cola de Espera', icon: Activity, badge: tickets.filter(t => caja && t.cajaDiariaId === caja.id && t.estadoAtencion !== 'ATENDIDO').length },
            { id: 'cierre', label: 'Arqueo de Caja', icon: Wallet },
            { id: 'egresos', label: 'Egresos & Gastos', icon: TrendingUp },
            { id: 'importer', label: 'Importador Excel', icon: FileSpreadsheet, badge: 'Masivo' },
            { id: 'liquidaciones', label: 'Liquidación Médicos', icon: Users },
            { id: 'tarifario', label: 'Tarifario Oficial', icon: Layers },
            { id: 'admin', label: 'Configuración & Admin', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md font-semibold text-xs transition-all ${
                  isActive
                    ? 'bg-zinc-900 text-zinc-50 shadow-sm'
                    : 'text-zinc-650 hover:text-zinc-950 hover:bg-zinc-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-zinc-50' : 'text-zinc-400'}`} />
                  <span>{tab.label}</span>
                </div>
                {tab.badge !== undefined && (
                  <span
                    className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-zinc-800 text-zinc-300 border border-zinc-700' : 'bg-zinc-150 text-zinc-600'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Status and Time Footer */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50/50 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-medium text-zinc-500">
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <ShieldCheck className="h-3 w-3" /> Servidor OK
            </span>
            <span className="flex items-center gap-1 font-semibold">
              <Clock className="h-3 w-3 text-zinc-400" /> {currentTime}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Top Header Bar Minimalist White */}
        <header className="bg-white border-b border-zinc-200 sticky top-0 z-20 px-6 py-4 flex items-center justify-between gap-4">
          {/* Section title */}
          <div className="font-bold text-zinc-800 text-xs uppercase tracking-wider">
            Módulo: {activeTab === 'pos' ? 'Admisión & Ventas POS' : activeTab === 'cola' ? 'Cola de pacientes' : activeTab === 'cierre' ? 'Arqueo de Caja' : activeTab === 'egresos' ? 'Egresos & Gastos' : activeTab === 'importer' ? 'Importador Excel' : activeTab === 'liquidaciones' ? 'Liquidación Médica' : activeTab === 'tarifario' ? 'Tarifario de Servicios' : 'Configuración & Admin'}
          </div>

          {/* Cash Shift Summary */}
          <div className="flex items-center gap-3">
            {caja?.abierta ? (
              <div className="bg-white border border-zinc-200 rounded-lg px-4 py-1.5 flex items-center gap-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                  </span>
                  <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">TURNO ACTIVO</span>
                </div>
                <div className="h-5 w-px bg-zinc-250"></div>
                <div className="text-right">
                  <div className="text-[9px] text-zinc-400 uppercase font-medium">Efectivo Esperado</div>
                  <div className="text-sm font-semibold text-zinc-950">
                    S/ {Number(caja.montoEfectivoEsperado).toFixed(2)}
                  </div>
                </div>
                <div className="text-right border-l border-zinc-200 pl-3">
                  <div className="text-[9px] text-zinc-400 uppercase font-medium">Digital (Yape/POS)</div>
                  <div className="text-sm font-semibold text-zinc-800">
                    S/ {Number(caja.montoDigitalEsperado).toFixed(2)}
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleOpenCaja}
                className="bg-zinc-900 hover:bg-zinc-900/90 text-zinc-50 font-semibold px-4 py-2 rounded-md shadow flex items-center gap-2 transition text-xs"
              >
                <Wallet className="h-4 w-4" /> ABRIR CAJA DE ATENCIÓN (S/ 100)
              </button>
            )}
          </div>
        </header>

        {/* Main Content Body */}
        <main className="w-full p-6 flex-1">
        {/* TAB 1: ADMISIÓN POS REAL CLINICAL FLOW */}
        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Formulario de Registro & Cobro (7 columnas) */}
            <div className="lg:col-span-7 space-y-5">
              <form onSubmit={handleCreateTicket} className="white-card rounded-lg p-6 shadow-sm border border-zinc-200 space-y-5">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-zinc-900" />
                    <h2 className="text-sm font-semibold text-zinc-900">Registrar Atención de Paciente</h2>
                  </div>
                  <span className="text-[11px] text-zinc-400 font-medium">[Esc] Limpiar formulario</span>
                </div>

                {/* BLOQUE 1: DATOS DEL PACIENTE (DNI / TELEFONO / EDAD) */}
                <div className="bg-zinc-50/50 rounded-lg p-4 border border-zinc-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5" /> 1. Datos Clínicos del Paciente
                    </span>
                    {isExistingPatient && (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Paciente Registrado
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    {/* Tipo & Numero Documento */}
                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">Doc. Identidad *</label>
                      <div className="flex gap-1">
                        <select
                          value={tipoDoc}
                          onChange={(e) => setTipoDoc(e.target.value as any)}
                          className="h-9 w-[65px] shrink-0 rounded-md border border-zinc-200 bg-white text-xs font-semibold text-zinc-700 px-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                        >
                          <option value="DNI">DNI</option>
                          <option value="CE">CE</option>
                          <option value="PASAPORTE">PAS</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Número"
                          value={numDoc}
                          onChange={(e) => handleDocOrPhoneSearch(e.target.value, 'doc')}
                          className="h-9 flex-1 min-w-0 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-900 font-mono font-medium placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                        />
                      </div>
                    </div>

                    {/* Celular Búsqueda */}
                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">N° Celular</label>
                      <input
                        type="text"
                        placeholder="Número"
                        value={celularPaciente}
                        onChange={(e) => handleDocOrPhoneSearch(e.target.value, 'phone')}
                        className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-950 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                      />
                    </div>

                    {/* Procedencia Ubigeo */}
                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">Procedencia *</label>
                      <select
                        value={procedenciaId}
                        onChange={(e) => setProcedenciaId(Number(e.target.value))}
                        className="h-9 w-full rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-800 font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                      >
                        {procedencias.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nombre} ({p.distrito || 'Local'})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Nombres y Apellidos */}
                    <div className="sm:col-span-8">
                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">Nombres y Apellidos Completos *</label>
                      <input
                        type="text"
                        placeholder="Nombre completo"
                        required
                        value={nombrePaciente}
                        onChange={(e) => setNombrePaciente(e.target.value)}
                        className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                      />
                    </div>

                    {/* Edad */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">Edad</label>
                      <input
                        type="number"
                        placeholder="Edad"
                        value={edadPaciente}
                        onChange={(e) => setEdadPaciente(e.target.value)}
                        className="h-9 w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-center text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                      />
                    </div>

                    {/* Historia Clínica */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">Hist. Clínica</label>
                      <input
                        type="text"
                        placeholder="N° Historia"
                        value={historiaClinica}
                        onChange={(e) => setHistoriaClinica(e.target.value)}
                        className="h-9 w-full rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                      />
                    </div>
                  </div>
                </div>

                {/* BLOQUE 2: MÉDICO CMP Y SELECCIÓN MULTISERVICIO */}
                <div className="bg-zinc-50/50 rounded-lg p-4 border border-zinc-200/80 space-y-3">
                  <span className="text-[11px] font-semibold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Stethoscope className="h-3.5 w-3.5" /> 2. Asignación Médica CMP y Servicios
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Médico Atendiente CMP */}
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">Médico Tratante (CMP / Consultorio) *</label>
                      <select
                        value={medicoId}
                        onChange={(e) => setMedicoId(Number(e.target.value))}
                        className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
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
                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">Médico Solicitante / Derivador</label>
                      <select
                        value={medicoSolicitanteId || ''}
                        onChange={(e) => setMedicoSolicitanteId(e.target.value ? Number(e.target.value) : undefined)}
                        className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-750 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
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
                  <div className="pt-1">
                    <label className="block text-[11px] font-medium text-zinc-500 mb-1">Añadir Servicios al Comprobante</label>
                    <div className="flex gap-2">
                      <select
                        value={tarifaSeleccionadaId}
                        onChange={(e) => setTarifaSeleccionadaId(Number(e.target.value))}
                        className="flex-1 h-9 rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
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
                        className="bg-zinc-900 hover:bg-zinc-900/90 text-zinc-50 font-medium px-4 py-1.5 rounded-md text-xs flex items-center gap-1 shadow transition"
                      >
                        <Plus className="h-3.5 w-3.5" /> Agregar
                      </button>
                    </div>
                  </div>

                  {/* Canasta de servicios agregados */}
                  <div className="bg-white rounded-md border border-zinc-200 p-3 space-y-2">
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">Detalle del Comprobante ({cartItems.length} servicios)</span>
                    {cartItems.length === 0 ? (
                      <p className="text-xs text-zinc-400 text-center py-2">Sin servicios agregados.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {cartItems.map((item) => (
                          <div key={item.tarifaId} className="flex items-center justify-between text-xs py-1 border-b border-zinc-100 last:border-none">
                            <span className="font-medium text-zinc-800">{item.descripcion} (x{item.cantidad})</span>
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-zinc-950">S/ {(item.precioUnitario * item.cantidad).toFixed(2)}</span>
                              <button type="button" onClick={() => removeItemFromCart(item.tarifaId)} className="text-zinc-400 hover:text-zinc-900 transition">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* BLOQUE 3: TIPO DE COMPROBANTE SUNAT (BOLETA / FACTURA / TICKET) */}
                <div className="bg-zinc-50/50 rounded-lg p-4 border border-zinc-200/80 space-y-3">
                  <span className="text-[11px] font-semibold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" /> 3. Comprobante SUNAT y Forma de Pago
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
                        className={`p-2 rounded-md border text-center transition ${
                          tipoComprobante === comp.id
                            ? 'bg-zinc-900 border-zinc-900 text-zinc-50 shadow-sm'
                            : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950'
                        }`}
                      >
                        <div className="text-xs font-semibold">{comp.label}</div>
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
                        onChange={(e) => handleRucSearch(e.target.value)}
                        className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs font-mono font-semibold text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                      />
                      <input
                        type="text"
                        placeholder="Razón Social Empresa"
                        value={razonSocialFactura}
                        onChange={(e) => setRazonSocialFactura(e.target.value)}
                        className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                      />
                    </div>
                  )}

                  {/* Formas de Pago */}
                  <div className="grid grid-cols-4 gap-2 pt-1">
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
                          className={`p-2 rounded-md border text-center transition flex flex-col items-center gap-1 ${
                            isSelected
                              ? 'bg-zinc-900 border-zinc-900 text-zinc-50 shadow-sm'
                              : 'bg-white border-zinc-200 text-zinc-650 hover:bg-zinc-50 hover:text-zinc-950'
                          }`}
                        >
                          <Icon className={`h-4 w-4 ${isSelected ? 'text-zinc-50' : 'text-zinc-500'}`} />
                          <span className="text-[10px] font-medium">{p.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* DESGLES FINANCIAL SPLIT CARD */}
                <div className="bg-zinc-950 text-zinc-50 rounded-lg p-4 space-y-2.5 shadow-sm border border-zinc-800">
                  <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider flex justify-between">
                    <span>Desglose Clínico Automático</span>
                    <span>Total Paciente: S/ {totalMontoPaciente.toFixed(2)}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs pt-1">
                    <div className="bg-zinc-900 p-2 rounded-md border border-zinc-800">
                      <div className="text-[9px] text-zinc-400 uppercase font-medium">Total Cobrado</div>
                      <div className="font-semibold text-zinc-50">S/ {totalMontoPaciente.toFixed(2)}</div>
                    </div>
                    <div className="bg-zinc-900 p-2 rounded-md border border-zinc-800">
                      <div className="text-[9px] text-zinc-400 uppercase font-medium">Com. Médico</div>
                      <div className="font-semibold text-zinc-100">S/ {totalMontoMedico.toFixed(2)}</div>
                    </div>
                    <div className="bg-zinc-900 p-2 rounded-md border border-zinc-800">
                      <div className="text-[9px] text-zinc-400 uppercase font-medium">Clínica Neto</div>
                      <div className="font-semibold text-zinc-100">S/ {totalMontoClinica.toFixed(2)}</div>
                    </div>
                    <div className="bg-zinc-900 p-2 rounded-md border border-zinc-800">
                      <div className="text-[9px] text-zinc-400 uppercase font-medium">Técnico / Solic.</div>
                      <div className="font-semibold text-zinc-100">S/ {(totalMontoTecnico + totalMontoSolicitante).toFixed(2)}</div>
                    </div>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full bg-zinc-900 hover:bg-zinc-900/90 text-zinc-50 font-medium py-3 px-6 rounded-md shadow flex items-center justify-center gap-2 text-xs transition"
                >
                  <Printer className="h-4 w-4" />
                  EMITIR E IMPRIMIR COMPROBANTE (Enter)
                </button>
              </form>
            </div>

            {/* Panel Derecho: Lista de Comprobantes Recientes (5 columnas) */}
            <div className="lg:col-span-5 space-y-5">
              {/* Stat box */}
              <div className="white-card rounded-lg p-5 shadow-sm border border-zinc-200 space-y-3">
                <h3 className="font-semibold text-zinc-900 text-xs flex items-center gap-2 border-b border-zinc-100 pb-2">
                  <Activity className="h-4 w-4 text-zinc-800" /> Resumen de Atenciones del Turno
                </h3>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-zinc-50/50 p-3 rounded-lg border border-zinc-200">
                    <div className="text-[10px] text-zinc-500 font-medium uppercase">Emitidos Hoy</div>
                    <div className="text-xl font-bold text-zinc-950 mt-1">{tickets.length}</div>
                    <div className="text-[9px] text-zinc-400 mt-1">Comprobantes</div>
                  </div>
                  <div className="bg-zinc-50/50 p-3 rounded-lg border border-zinc-200">
                    <div className="text-[10px] text-zinc-500 font-medium uppercase">Recaudado Bruto</div>
                    <div className="text-xl font-bold text-zinc-950 mt-1">
                      S/ {tickets.reduce((sum, t) => sum + Number(t.montoPaciente), 0).toFixed(2)}
                    </div>
                    <div className="text-[9px] text-zinc-450 mt-1">Efectivo + Digital</div>
                  </div>
                </div>
              </div>

              {/* Tickets emitidos */}
              <div className="white-card rounded-lg p-5 shadow-sm border border-zinc-200 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                  <h3 className="font-semibold text-zinc-900 text-xs flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-zinc-850" /> Histórico de Comprobantes
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-zinc-500 font-medium">{tickets.length} registros</span>
                    <button
                      type="button"
                      onClick={() => {
                        setHistoryCurrentPage(1);
                        setShowHistoryModal(true);
                      }}
                      className="bg-zinc-100 hover:bg-zinc-200 text-zinc-850 font-semibold border border-zinc-300 rounded px-2 py-0.5 text-[10px] transition"
                    >
                      Ver Todo / Filtrar
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
                  {tickets.length === 0 ? (
                    <div className="text-center py-12 text-zinc-400 text-xs">
                      No hay comprobantes emitidos en el turno actual.
                    </div>
                  ) : (
                    tickets.slice(0, 50).map((t) => (
                      <div
                        key={t.id}
                        className="bg-zinc-50/30 hover:bg-zinc-50/80 p-3 rounded-md border border-zinc-250/70 flex items-center justify-between transition"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-semibold text-zinc-900">{t.numeroBoleta || t.numeroTicket}</span>
                            <span className="bg-zinc-100 text-zinc-800 border border-zinc-200 text-[9px] font-medium px-1.5 py-0.5 rounded uppercase">
                              {(t.tipoComprobante || (t.numeroBoleta ? 'BOLETA_ELECTRONICA' : 'TICKET_INTERNO')).replace('_ELECTRONICA', '').replace('_INTERNO', '')}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-zinc-950">{t.paciente?.nombre}</div>
                          <div className="text-[11px] text-zinc-500">
                            Dr. {t.medico?.nombre} • {t.consultorio}
                          </div>
                        </div>

                        <div className="text-right space-y-1">
                          <div className="text-sm font-semibold text-zinc-950">S/ {Number(t.montoPaciente).toFixed(2)}</div>
                          <button
                            onClick={() => setPrintedTicket(t)}
                            className="text-[11px] text-zinc-800 hover:text-zinc-950 hover:underline flex items-center gap-1 justify-end ml-auto font-medium transition"
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
          <div className="white-card rounded-lg p-6 shadow-sm border border-zinc-200 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div>
                <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-zinc-900" /> Sala de Espera y Cola de Atención Médica
                </h2>
                <p className="text-xs text-zinc-555">Gestión de llamados a consultorio en tiempo real</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['ESPERA', 'CONSULTORIO', 'ATENDIDO'].map((est) => {
                const list = tickets.filter((t) => caja && t.cajaDiariaId === caja.id && (t.estadoAtencion || 'ESPERA') === est);
                const title = est === 'ESPERA' ? 'En Sala de Espera' : est === 'CONSULTORIO' ? 'En Consultorio' : 'Atendidos';
                const badgeColor = est === 'ESPERA' ? 'bg-amber-50 text-amber-700 border-amber-200' : est === 'CONSULTORIO' ? 'bg-zinc-100 text-zinc-800 border-zinc-250' : 'bg-emerald-50 text-emerald-700 border-emerald-200';

                return (
                  <div key={est} className="bg-zinc-50/50 p-4 rounded-lg border border-zinc-200 space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                      <span className="font-semibold text-zinc-800 text-xs">{title}</span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${badgeColor}`}>{list.length}</span>
                    </div>

                    <div className="space-y-2">
                      {list.length === 0 ? (
                        <p className="text-xs text-zinc-400 text-center py-6">Sin pacientes en este estado.</p>
                      ) : (
                        list.map((tk) => (
                          <div key={tk.id} className="bg-white p-3 rounded-md border border-zinc-200 space-y-2 shadow-sm">
                            <div className="flex justify-between items-start">
                              <span className="font-semibold text-xs text-zinc-900">{tk.paciente?.nombre}</span>
                              <span className="text-[10px] font-mono text-zinc-400">{tk.numeroTicket}</span>
                            </div>
                            <div className="text-[11px] text-zinc-550">
                              Dr. {tk.medico?.nombre} ({tk.consultorio})
                            </div>

                            <div className="flex gap-1 pt-1">
                              {est === 'ESPERA' && (
                                <button
                                  onClick={() => handleUpdateEstadoAtencion(tk.id, 'CONSULTORIO')}
                                  className="w-full bg-zinc-900 hover:bg-zinc-900/90 text-zinc-50 font-medium text-[10px] py-1 rounded transition"
                                >
                                  Llamar a Consultorio
                                </button>
                              )}
                              {est === 'CONSULTORIO' && (
                                <button
                                  onClick={() => handleUpdateEstadoAtencion(tk.id, 'ATENDIDO')}
                                  className="w-full bg-zinc-900 hover:bg-zinc-900/90 text-zinc-50 font-medium text-[10px] py-1 rounded transition"
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
          <div className="max-w-2xl mx-auto white-card rounded-lg p-6 border border-zinc-200 shadow-sm space-y-6">
            <div className="border-b border-zinc-100 pb-4">
              <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                <Wallet className="h-4 w-4 text-zinc-900" /> Arqueo Ciego de Caja Chica
              </h2>
              <p className="text-xs text-zinc-550">
                Protocolo de seguridad: Ingrese el dinero contado en físico sin visualizar previamente el saldo esperado
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-zinc-50/50 p-4 rounded-lg border border-zinc-200 grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Monto Apertura</div>
                  <div className="text-base font-semibold text-zinc-950 mt-0.5">S/ {Number(caja?.montoApertura || 0).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Estado Actual</div>
                  <div className="text-base font-semibold text-emerald-700 uppercase mt-0.5">Turno Abierto</div>
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
                  onChange={(e) => setMontoFisicoCierre(e.target.value)}
                  className="h-11 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-base font-semibold text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Observaciones de Recepción</label>
                <textarea
                  rows={2}
                  placeholder="Notas de billetes en mal estado o vuelto de caja..."
                  value={observacionesCierre}
                  onChange={(e) => setObservacionesCierre(e.target.value)}
                  className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                />
              </div>

              {montoFisicoCierre !== '' && (
                <div className="bg-zinc-950 text-zinc-50 p-4 rounded-lg space-y-1.5 shadow-sm border border-zinc-800 animate-in fade-in">
                  <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Resultado Auditoría de Cierre</div>
                  <div className="flex justify-between text-xs font-medium">
                    <span>Efectivo Físico Declarado:</span>
                    <span>S/ {Number(montoFisicoCierre).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-medium border-t border-zinc-850 pt-1">
                    <span>Efectivo Esperado en Sistema:</span>
                    <span>S/ {Number(caja?.montoEfectivoEsperado || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold border-t border-zinc-850 pt-1">
                    <span>Diferencia:</span>
                    <span
                      className={
                        Number(montoFisicoCierre) - Number(caja?.montoEfectivoEsperado || 0) >= 0
                          ? 'text-emerald-400'
                          : 'text-rose-450'
                      }
                    >
                      S/ {(Number(montoFisicoCierre) - Number(caja?.montoEfectivoEsperado || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={handleCloseCaja}
                className="w-full bg-zinc-900 hover:bg-zinc-900/90 text-zinc-50 font-medium py-2.5 rounded-md shadow transition text-xs"
              >
                PROCESAR CIERRE DE TURNO Y ARQUEO
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: EGRESOS & GASTOS */}
        {activeTab === 'egresos' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 white-card rounded-lg p-5 border border-zinc-200 shadow-sm space-y-4">
              <h2 className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-zinc-800" /> Registrar Egreso / Gasto
              </h2>

              <form onSubmit={handleCreateEgreso} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-500 mb-1">Tipo de Egreso *</label>
                  <select
                    value={tipoEgreso}
                    onChange={(e) => setTipoEgreso(e.target.value as any)}
                    className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                  >
                    <option value="GASTO">Gasto Operativo (Insumos/Limpieza)</option>
                    <option value="PLANILLA">Pago Planilla / Personal</option>
                    <option value="PAGO_FIJO">Servicio Fijo (Luz/Agua/Internet)</option>
                    <option value="ASCENSOR">Proyecto Ascensor</option>
                    <option value="DEVOLUCION">Devolución a Paciente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-500 mb-1">Monto Egreso (S/) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    placeholder="50.00"
                    value={montoEgreso}
                    onChange={(e) => setMontoEgreso(e.target.value)}
                    className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-500 mb-1">Proveedor / Beneficiario</label>
                  <input
                    type="text"
                    placeholder="Ej. Botica Central / Imprenta"
                    value={proveedorEgreso}
                    onChange={(e) => setProveedorEgreso(e.target.value)}
                    className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-500 mb-1">Concepto / Glosa *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Compra de insumos médicos y mascarillas"
                    value={observacionEgreso}
                    onChange={(e) => setObservacionEgreso(e.target.value)}
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
              <h2 className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-3">Egresos Registrados en Turno</h2>

              <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin">
                {egresos.length === 0 ? (
                  <div className="text-center py-12 text-zinc-400 text-xs">Sin egresos registrados.</div>
                ) : (
                  egresos.map((eg) => (
                    <div
                      key={eg.id}
                      className="bg-zinc-50/50 p-3 rounded-md border border-zinc-200 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-medium px-2 py-0.5 rounded uppercase">
                            {eg.tipoEgreso}
                          </span>
                          <span className="text-[11px] text-zinc-400">{new Date(eg.fecha).toLocaleTimeString()}</span>
                        </div>
                        <div className="text-xs font-semibold text-zinc-900 mt-1">{eg.observaciones}</div>
                        <div className="text-[11px] text-zinc-500">{eg.proveedor}</div>
                      </div>
                      <div className="text-sm font-semibold text-rose-600">- S/ {Number(eg.monto).toFixed(2)}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: IMPORTADOR EXCEL */}
        {activeTab === 'importer' && (
          <div className="max-w-3xl mx-auto white-card rounded-lg p-6 border border-zinc-200 shadow-sm space-y-6">
            <div className="border-b border-zinc-100 pb-4">
              <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-zinc-900" /> Importador Masivo de Hojas Excel Históricas
              </h2>
              <p className="text-xs text-zinc-550">Previsualización dry-run e inserción transaccional en PostgreSQL</p>
            </div>

            <div className="border border-dashed border-zinc-300 hover:border-zinc-500 bg-zinc-50/30 rounded-lg p-8 text-center space-y-3 transition">
              <Upload className="h-8 w-8 text-zinc-400 mx-auto" />
              <div>
                <p className="text-xs font-semibold text-zinc-900">Arrastre el archivo Excel consolidado de caja (.xlsx)</p>
                <p className="text-[11px] text-zinc-500">Soporta pestañas de Consultas, Rayos X, Certificados y Egresos</p>
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
                className="inline-block bg-white hover:bg-zinc-50 text-zinc-800 font-medium px-4 py-1.5 rounded-md border border-zinc-200 cursor-pointer text-[11px] shadow-sm transition"
              >
                {excelFile ? excelFile.name : 'Seleccionar Archivo Excel'}
              </label>
            </div>

            {excelFile && (
              <button
                onClick={handleDryRun}
                disabled={importing}
                className="w-full bg-zinc-900 hover:bg-zinc-900/90 text-zinc-50 font-medium py-2 rounded-md shadow transition text-xs disabled:opacity-55 flex items-center justify-center gap-2"
              >
                {importing ? 'PROCESANDO ARCHIVO EXCEL...' : 'EJECUTAR PREVISUALIZACIÓN DRY-RUN'}
              </button>
            )}

            {dryRunData && (
              <div className="bg-zinc-50/50 p-5 rounded-lg border border-zinc-200 space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                  <span className="text-xs font-semibold text-zinc-900">Resultado Dry-Run ({dryRunData.mesIdentificado})</span>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium px-2 py-0.5 rounded-md">
                    Analizado Correctamente
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-white p-2.5 rounded-md border border-zinc-200">
                    <div className="text-[9px] text-zinc-500 font-medium uppercase">Ingresos</div>
                    <div className="text-sm font-semibold text-zinc-950 mt-1">S/ {dryRunData.totalCobrado.toFixed(2)}</div>
                  </div>
                  <div className="bg-white p-2.5 rounded-md border border-zinc-200">
                    <div className="text-[9px] text-zinc-500 font-medium uppercase">Tickets</div>
                    <div className="text-sm font-semibold text-zinc-950 mt-1">{dryRunData.totalTickets}</div>
                  </div>
                  <div className="bg-white p-2.5 rounded-md border border-zinc-200">
                    <div className="text-[9px] text-zinc-500 font-medium uppercase">Gastos</div>
                    <div className="text-sm font-semibold text-rose-600 mt-1">S/ {dryRunData.totalEgresosMonto.toFixed(2)}</div>
                  </div>
                  <div className="bg-white p-2.5 rounded-md border border-zinc-200">
                    <div className="text-[9px] text-zinc-500 font-medium uppercase">Cant. Egresos</div>
                    <div className="text-sm font-semibold text-rose-600 mt-1">{dryRunData.totalEgresos}</div>
                  </div>
                </div>

                {dryRunData.medicosNuevos && dryRunData.medicosNuevos.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[10px] font-semibold text-zinc-700">Médicos Nuevos Detectados ({dryRunData.medicosNuevos.length}):</div>
                    <div className="flex flex-wrap gap-1">
                      {dryRunData.medicosNuevos.map((med: string, i: number) => (
                        <span key={i} className="bg-zinc-100 text-zinc-800 text-[10px] px-2 py-0.5 rounded border border-zinc-200">
                          {med}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {dryRunData.procedenciasNuevas && dryRunData.procedenciasNuevas.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[10px] font-semibold text-zinc-700">Procedencias Nuevas ({dryRunData.procedenciasNuevas.length}):</div>
                    <div className="flex flex-wrap gap-1">
                      {dryRunData.procedenciasNuevas.map((proc: string, i: number) => (
                        <span key={i} className="bg-zinc-100 text-zinc-800 text-[10px] px-2 py-0.5 rounded border border-zinc-200">
                          {proc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {dryRunData.alertas && dryRunData.alertas.length > 0 && (
                  <div className="space-y-1 bg-amber-50/50 border border-amber-200 p-3 rounded-md">
                    <div className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider">Alertas / Advertencias:</div>
                    <ul className="list-disc pl-4 text-[10px] text-amber-700 space-y-0.5">
                      {dryRunData.alertas.map((alt: string, i: number) => (
                        <li key={i}>{alt}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  onClick={handleConfirmImport}
                  disabled={importing}
                  className="w-full bg-zinc-900 hover:bg-zinc-900/90 text-zinc-50 font-medium py-2.5 rounded-md shadow transition text-xs disabled:opacity-55"
                >
                  {importing ? 'GUARDANDO EN BASE DE DATOS...' : 'CONFIRMAR E INSERTAR EN BASE DE DATOS'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: LIQUIDACIÓN MÉDICA */}
        {activeTab === 'liquidaciones' && (() => {
          // Extract unique specialties from doctors
          const specialties = Array.from(new Set(medicos.map((m) => m.especialidad).filter(Boolean)));

          // Filter medicos list
          const filteredMedicos = medicos.filter((med) => {
            if (liqSearch) {
              const term = liqSearch.toLowerCase().trim();
              if (!med.nombre.toLowerCase().includes(term)) return false;
            }
            if (liqSpecialty && med.especialidad !== liqSpecialty) {
              return false;
            }
            return true;
          });

          return (
            <div className="white-card rounded-lg p-6 border border-zinc-200 shadow-sm space-y-6">
              <div className="border-b border-zinc-100 pb-4">
                <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                  <Users className="h-4 w-4 text-zinc-900" /> Liquidación de Comisiones por Médico CMP
                </h2>
                <p className="text-xs text-zinc-550">Cálculo de honorarios profesionales según tarifario oficial</p>
              </div>

              {/* Filters Panel */}
              <div className="bg-zinc-50/50 p-4 border border-zinc-200 rounded-lg grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Nombre Médico</label>
                  <input
                    type="text"
                    placeholder="Ej. Perez, Ramirez..."
                    value={liqSearch}
                    onChange={(e) => setLiqSearch(e.target.value)}
                    className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Especialidad</label>
                  <select
                    value={liqSpecialty}
                    onChange={(e) => setLiqSpecialty(e.target.value)}
                    className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-800 font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                  >
                    <option value="">-- Todas --</option>
                    {specialties.map((esp, idx) => (
                      <option key={idx} value={esp}>
                        {esp}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Desde Fecha</label>
                  <input
                    type="date"
                    value={liqDateFrom}
                    onChange={(e) => setLiqDateFrom(e.target.value)}
                    className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-xs text-zinc-800 focus-visible:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Hasta Fecha</label>
                  <input
                    type="date"
                    value={liqDateTo}
                    onChange={(e) => setLiqDateTo(e.target.value)}
                    className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-xs text-zinc-800 focus-visible:outline-none"
                  />
                </div>

                <div className="md:col-span-5 flex justify-end gap-2 text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setLiqSearch('');
                      setLiqSpecialty('');
                      setLiqDateFrom('');
                      setLiqDateTo('');
                    }}
                    className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold border border-zinc-200 rounded-md px-3 py-1 transition"
                  >
                    Limpiar Filtros
                  </button>
                </div>
              </div>

              {/* Doctors Grid */}
              {filteredMedicos.length === 0 ? (
                <div className="text-center py-12 text-zinc-400 text-xs">
                  No se encontraron médicos coincidentes con los filtros.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMedicos.map((med) => {
                    // Filter tickets based on doctor and date range
                    const doctorTickets = tickets.filter((t) => {
                      if (t.medicoId !== med.id) return false;
                      if (t.estado !== 'ACTIVO') return false;

                      if (liqDateFrom) {
                        const dateFromObj = new Date(liqDateFrom);
                        dateFromObj.setHours(0, 0, 0, 0);
                        if (new Date(t.fecha) < dateFromObj) return false;
                      }
                      if (liqDateTo) {
                        const dateToObj = new Date(liqDateTo);
                        dateToObj.setHours(23, 59, 59, 999);
                        if (new Date(t.fecha) > dateToObj) return false;
                      }

                      return true;
                    });

                    const totalComision = doctorTickets.reduce((sum, t) => sum + Number(t.montoMedico), 0);

                    return (
                      <div key={med.id} className="bg-zinc-50/50 p-4 rounded-md border border-zinc-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-zinc-900 text-xs">{med.nombre}</div>
                          <span className="bg-zinc-100 text-zinc-800 border border-zinc-200 text-[9px] font-medium px-2 py-0.5 rounded">
                            CMP: {med.cmp || 'N/A'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between border-t border-zinc-200/60 pt-2 text-[11px]">
                          <span className="text-zinc-500">Especialidad:</span>
                          <span className="font-medium text-zinc-800">{med.especialidad}</span>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-dashed border-zinc-200/60 mt-1">
                          <span className="text-zinc-500 font-medium">Comprobantes ({doctorTickets.length}):</span>
                          <span className="font-medium text-zinc-800">
                            S/ {doctorTickets.reduce((sum, t) => sum + Number(t.montoPaciente), 0).toFixed(2)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-200/60">
                          <span className="text-zinc-505 font-semibold text-zinc-900">Total Comisión Médico:</span>
                          <span className="font-bold text-emerald-700">S/ {totalComision.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* TAB 7: TARIFARIO OFICIAL */}
        {activeTab === 'tarifario' && (() => {
          const categories = Array.from(new Set(tarifas.map((t) => t.categoria).filter(Boolean)));

          const filteredTarifas = tarifas.filter((tf) => {
            if (tarSearch) {
              const term = tarSearch.toLowerCase().trim();
              const matchesDesc = tf.descripcion.toLowerCase().includes(term);
              const matchesEsp = tf.especialidad.toLowerCase().includes(term);
              if (!matchesDesc && !matchesEsp) return false;
            }
            if (tarCategory && tf.categoria !== tarCategory) {
              return false;
            }
            return true;
          });

          return (
            <div className="white-card rounded-lg p-6 border border-zinc-200 shadow-sm space-y-6">
              <div className="border-b border-zinc-100 pb-4">
                <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-zinc-900" /> Tarifario Oficial de Servicios Médicos
                </h2>
                <p className="text-xs text-zinc-550">Costos para pacientes y reparto porcentual/fijo por convenio</p>
              </div>

              {/* Filters Bar */}
              <div className="bg-zinc-50/50 p-4 border border-zinc-200 rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Buscar Servicio / Especialidad</label>
                  <input
                    type="text"
                    placeholder="Ej. Consulta general, ginecologia, ecografía..."
                    value={tarSearch}
                    onChange={(e) => setTarSearch(e.target.value)}
                    className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Categoría</label>
                  <select
                    value={tarCategory}
                    onChange={(e) => setTarCategory(e.target.value)}
                    className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-800 font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                  >
                    <option value="">-- Todas --</option>
                    {categories.map((cat, idx) => (
                      <option key={idx} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3 flex justify-end gap-2 text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setTarSearch('');
                      setTarCategory('');
                    }}
                    className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold border border-zinc-200 rounded-md px-3 py-1 transition"
                  >
                    Limpiar Filtros
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto border border-zinc-200 rounded-lg">
                {filteredTarifas.length === 0 ? (
                  <div className="text-center py-12 text-zinc-400 text-xs bg-white">
                    No se encontraron servicios coincidentes con los filtros.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-zinc-50 text-zinc-500 uppercase font-semibold text-[10px] tracking-wider border-b border-zinc-200">
                        <th className="p-3">Categoría</th>
                        <th className="p-3">Descripción</th>
                        <th className="p-3">Precio Paciente</th>
                        <th className="p-3">Pago Médico</th>
                        <th className="p-3">Clínica Neto</th>
                        <th className="p-3">Técnico Placas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 bg-white">
                      {filteredTarifas.map((tf) => (
                        <tr key={tf.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="p-3 font-semibold text-zinc-900">{tf.categoria}</td>
                          <td className="p-3 text-zinc-700">{tf.descripcion}</td>
                          <td className="p-3 font-semibold text-zinc-950">S/ {Number(tf.precioTotal).toFixed(2)}</td>
                          <td className="p-3 text-zinc-800">S/ {Number(tf.comisionMedico).toFixed(2)}</td>
                          <td className="p-3 text-zinc-800">S/ {Number(tf.comisionClinica).toFixed(2)}</td>
                          <td className="p-3 text-zinc-500">{tf.requiereTecnico ? 'Samuel (S/ 5.00)' : 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          );
        })()}

        {/* TAB 8: CONFIGURACIÓN & ADMIN */}
        {activeTab === 'admin' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="white-card rounded-lg p-5 border border-zinc-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-zinc-900 flex items-center justify-center">
                  <Settings className="h-4 w-4 text-zinc-50" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-zinc-900">Configuración & Administración</h2>
                  <p className="text-xs text-zinc-500">Edita médicos (CMP incluido), tarifas y procedencias. Los cambios se guardan en la base de datos al instante.</p>
                </div>
              </div>

              {/* Feedback banners */}
              {adminSuccess && (
                <div className="mt-3 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium px-3 py-2 rounded-md">
                  <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" /> {adminSuccess}
                </div>
              )}
              {adminError && (
                <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-3 py-2 rounded-md">
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" /> {adminError}
                  <button onClick={() => setAdminError(null)} className="ml-auto text-red-400 hover:text-red-700"><X className="h-3 w-3" /></button>
                </div>
              )}
            </div>

            {/* SECTION 1: MEDICOS */}
            <div className="white-card rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                  <Users className="h-4 w-4 text-zinc-700" /> Gestión de Médicos
                  <span className="text-[10px] font-medium bg-zinc-100 text-zinc-500 border border-zinc-200 px-2 py-0.5 rounded-full">{medicos.length} registros</span>
                </h3>
                <p className="text-[11px] text-zinc-400">Edita nombre, especialidad, CMP y consultorio asignado.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-zinc-50 text-zinc-500 uppercase text-[10px] font-semibold tracking-wider border-b border-zinc-200">
                      <th className="p-3 text-left">Nombre</th>
                      <th className="p-3 text-left">Especialidad</th>
                      <th className="p-3 text-left">Grado</th>
                      <th className="p-3 text-left">CMP</th>
                      <th className="p-3 text-left">Consultorio</th>
                      <th className="p-3 text-left">Celular</th>
                      <th className="p-3 text-left">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 bg-white">
                    {medicos.map(med => (
                      <tr key={med.id} className={`transition ${editingMedicoId === med.id ? 'bg-zinc-50/80' : 'hover:bg-zinc-50/40'}`}>
                        {editingMedicoId === med.id ? (
                          <>
                            <td className="p-2">
                              <input
                                className="w-full border border-zinc-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400"
                                value={editingMedicoData.nombre ?? med.nombre}
                                onChange={e => setEditingMedicoData(d => ({ ...d, nombre: e.target.value }))}
                              />
                            </td>
                            <td className="p-2">
                              <input
                                className="w-full border border-zinc-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400"
                                value={editingMedicoData.especialidad ?? med.especialidad}
                                onChange={e => setEditingMedicoData(d => ({ ...d, especialidad: e.target.value }))}
                              />
                            </td>
                            <td className="p-2">
                              <select
                                className="border border-zinc-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400"
                                value={editingMedicoData.grado ?? med.grado}
                                onChange={e => setEditingMedicoData(d => ({ ...d, grado: e.target.value }))}
                              >
                                <option>Doctor</option>
                                <option>Doctora</option>
                                <option>Licenciado</option>
                                <option>Licenciada</option>
                                <option>Técnico</option>
                              </select>
                            </td>
                            <td className="p-2">
                              <input
                                className="w-32 border border-zinc-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400"
                                placeholder="Ej: 078451"
                                value={editingMedicoData.cmp ?? med.cmp ?? ''}
                                onChange={e => setEditingMedicoData(d => ({ ...d, cmp: e.target.value }))}
                              />
                            </td>
                            <td className="p-2">
                              <input
                                className="w-36 border border-zinc-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400"
                                placeholder="Consultorio 1"
                                value={editingMedicoData.consultorioAsignado ?? med.consultorioAsignado ?? ''}
                                onChange={e => setEditingMedicoData(d => ({ ...d, consultorioAsignado: e.target.value }))}
                              />
                            </td>
                            <td className="p-2">
                              <input
                                className="w-28 border border-zinc-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400"
                                placeholder="Celular"
                                value={editingMedicoData.celular ?? med.celular ?? ''}
                                onChange={e => setEditingMedicoData(d => ({ ...d, celular: e.target.value }))}
                              />
                            </td>
                            <td className="p-2">
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => handleSaveMedico(med.id)}
                                  disabled={adminSaving}
                                  className="flex items-center gap-1 bg-zinc-900 hover:bg-zinc-700 text-zinc-50 text-[10px] font-medium px-2.5 py-1.5 rounded transition disabled:opacity-50"
                                >
                                  <Save className="h-3 w-3" /> Guardar
                                </button>
                                <button
                                  onClick={() => { setEditingMedicoId(null); setEditingMedicoData({}); }}
                                  className="flex items-center gap-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[10px] font-medium px-2 py-1.5 rounded border border-zinc-200 transition"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-3 font-medium text-zinc-900">{med.nombre}</td>
                            <td className="p-3 text-zinc-600">{med.especialidad}</td>
                            <td className="p-3 text-zinc-500">{med.grado}</td>
                            <td className="p-3">
                              {med.cmp
                                ? <span className="font-mono text-zinc-800 bg-zinc-100 px-1.5 py-0.5 rounded text-[10px] border border-zinc-200">{med.cmp}</span>
                                : <span className="text-zinc-300 text-[10px] italic">Sin CMP</span>
                              }
                            </td>
                            <td className="p-3 text-zinc-500 text-[11px]">{med.consultorioAsignado || <span className="text-zinc-300">—</span>}</td>
                            <td className="p-3 text-zinc-500 text-[11px]">{med.celular || <span className="text-zinc-300">—</span>}</td>
                            <td className="p-3">
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => { setEditingMedicoId(med.id); setEditingMedicoData({}); setAdminError(null); }}
                                  className="flex items-center gap-1 text-[10px] font-medium text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 px-2 py-1.5 rounded transition"
                                >
                                  <Pencil className="h-3 w-3" /> Editar
                                </button>
                                <button
                                  onClick={() => handleDeleteMedico(med.id)}
                                  className="flex items-center gap-1 text-[10px] font-medium text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2 py-1.5 rounded transition"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 2: TARIFAS */}
            <div className="white-card rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-zinc-700" /> Tarifas & Comisiones
                  <span className="text-[10px] font-medium bg-zinc-100 text-zinc-500 border border-zinc-200 px-2 py-0.5 rounded-full">{tarifas.length} registros</span>
                </h3>
                <p className="text-[11px] text-zinc-400">Edita precios, comisiones de médico, clínica y técnico.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-zinc-50 text-zinc-500 uppercase text-[10px] font-semibold tracking-wider border-b border-zinc-200">
                      <th className="p-3 text-left">Categoría</th>
                      <th className="p-3 text-left">Descripción</th>
                      <th className="p-3 text-left">Precio Total</th>
                      <th className="p-3 text-left">Comis. Médico</th>
                      <th className="p-3 text-left">Comis. Clínica</th>
                      <th className="p-3 text-left">Técnico</th>
                      <th className="p-3 text-left">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 bg-white">
                    {tarifas.map(tf => (
                      <tr key={tf.id} className={`transition ${editingTarifaId === tf.id ? 'bg-zinc-50/80' : 'hover:bg-zinc-50/40'}`}>
                        {editingTarifaId === tf.id ? (
                          <>
                            <td className="p-2">
                              <input
                                className="w-28 border border-zinc-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400"
                                value={editingTarifaData.categoria ?? tf.categoria}
                                onChange={e => setEditingTarifaData(d => ({ ...d, categoria: e.target.value }))}
                              />
                            </td>
                            <td className="p-2">
                              <input
                                className="w-48 border border-zinc-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400"
                                value={editingTarifaData.descripcion ?? tf.descripcion}
                                onChange={e => setEditingTarifaData(d => ({ ...d, descripcion: e.target.value }))}
                              />
                            </td>
                            <td className="p-2">
                              <input type="number" min="0"
                                className="w-20 border border-zinc-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400"
                                value={editingTarifaData.precioTotal ?? tf.precioTotal}
                                onChange={e => setEditingTarifaData(d => ({ ...d, precioTotal: Number(e.target.value) }))}
                              />
                            </td>
                            <td className="p-2">
                              <input type="number" min="0"
                                className="w-20 border border-zinc-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400"
                                value={editingTarifaData.comisionMedico ?? tf.comisionMedico}
                                onChange={e => setEditingTarifaData(d => ({ ...d, comisionMedico: Number(e.target.value) }))}
                              />
                            </td>
                            <td className="p-2">
                              <input type="number" min="0"
                                className="w-20 border border-zinc-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400"
                                value={editingTarifaData.comisionClinica ?? tf.comisionClinica}
                                onChange={e => setEditingTarifaData(d => ({ ...d, comisionClinica: Number(e.target.value) }))}
                              />
                            </td>
                            <td className="p-2">
                              <label className="flex items-center gap-1.5 text-[10px] text-zinc-600">
                                <input type="checkbox"
                                  checked={editingTarifaData.requiereTecnico ?? tf.requiereTecnico}
                                  onChange={e => setEditingTarifaData(d => ({ ...d, requiereTecnico: e.target.checked }))}
                                />
                                Técnico
                              </label>
                            </td>
                            <td className="p-2">
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => handleSaveTarifa(tf.id)}
                                  disabled={adminSaving}
                                  className="flex items-center gap-1 bg-zinc-900 hover:bg-zinc-700 text-zinc-50 text-[10px] font-medium px-2.5 py-1.5 rounded transition disabled:opacity-50"
                                >
                                  <Save className="h-3 w-3" /> Guardar
                                </button>
                                <button
                                  onClick={() => { setEditingTarifaId(null); setEditingTarifaData({}); }}
                                  className="flex items-center gap-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[10px] font-medium px-2 py-1.5 rounded border border-zinc-200 transition"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-3 font-semibold text-zinc-900">{tf.categoria}</td>
                            <td className="p-3 text-zinc-600">{tf.descripcion}</td>
                            <td className="p-3 font-semibold text-zinc-950">S/ {Number(tf.precioTotal).toFixed(2)}</td>
                            <td className="p-3 text-zinc-700">S/ {Number(tf.comisionMedico).toFixed(2)}</td>
                            <td className="p-3 text-zinc-700">S/ {Number(tf.comisionClinica).toFixed(2)}</td>
                            <td className="p-3 text-zinc-500 text-[11px]">{tf.requiereTecnico ? 'Samuel (S/ 5)' : '—'}</td>
                            <td className="p-3">
                              <button
                                onClick={() => { setEditingTarifaId(tf.id); setEditingTarifaData({}); setAdminError(null); }}
                                className="flex items-center gap-1 text-[10px] font-medium text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 px-2 py-1.5 rounded transition"
                              >
                                <Pencil className="h-3 w-3" /> Editar
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 3: PROCEDENCIAS */}
            <div className="white-card rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                  <Building className="h-4 w-4 text-zinc-700" /> Procedencias de Pacientes
                  <span className="text-[10px] font-medium bg-zinc-100 text-zinc-500 border border-zinc-200 px-2 py-0.5 rounded-full">{procedencias.length} registros</span>
                </h3>
                <p className="text-[11px] text-zinc-400">Nombre del lugar de procedencia, distrito y provincia.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-zinc-50 text-zinc-500 uppercase text-[10px] font-semibold tracking-wider border-b border-zinc-200">
                      <th className="p-3 text-left">Nombre</th>
                      <th className="p-3 text-left">Distrito</th>
                      <th className="p-3 text-left">Provincia</th>
                      <th className="p-3 text-left">Departamento</th>
                      <th className="p-3 text-left">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 bg-white">
                    {procedencias.map(proc => (
                      <tr key={proc.id} className={`transition ${editingProcId === proc.id ? 'bg-zinc-50/80' : 'hover:bg-zinc-50/40'}`}>
                        {editingProcId === proc.id ? (
                          <>
                            <td className="p-2">
                              <input
                                className="w-40 border border-zinc-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400"
                                value={editingProcData.nombre ?? proc.nombre}
                                onChange={e => setEditingProcData(d => ({ ...d, nombre: e.target.value }))}
                              />
                            </td>
                            <td className="p-2">
                              <input
                                className="w-32 border border-zinc-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400"
                                value={editingProcData.distrito ?? proc.distrito ?? ''}
                                onChange={e => setEditingProcData(d => ({ ...d, distrito: e.target.value }))}
                              />
                            </td>
                            <td className="p-2">
                              <input
                                className="w-32 border border-zinc-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400"
                                value={editingProcData.provincia ?? proc.provincia ?? ''}
                                onChange={e => setEditingProcData(d => ({ ...d, provincia: e.target.value }))}
                              />
                            </td>
                            <td className="p-2">
                              <input
                                className="w-32 border border-zinc-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400"
                                value={editingProcData.departamento ?? proc.departamento ?? ''}
                                onChange={e => setEditingProcData(d => ({ ...d, departamento: e.target.value }))}
                              />
                            </td>
                            <td className="p-2">
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => handleSaveProc(proc.id)}
                                  disabled={adminSaving}
                                  className="flex items-center gap-1 bg-zinc-900 hover:bg-zinc-700 text-zinc-50 text-[10px] font-medium px-2.5 py-1.5 rounded transition disabled:opacity-50"
                                >
                                  <Save className="h-3 w-3" /> Guardar
                                </button>
                                <button
                                  onClick={() => { setEditingProcId(null); setEditingProcData({}); }}
                                  className="flex items-center gap-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[10px] font-medium px-2 py-1.5 rounded border border-zinc-200 transition"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-3 font-medium text-zinc-900">{proc.nombre}</td>
                            <td className="p-3 text-zinc-600">{proc.distrito || <span className="text-zinc-300">—</span>}</td>
                            <td className="p-3 text-zinc-600">{proc.provincia || <span className="text-zinc-300">—</span>}</td>
                            <td className="p-3 text-zinc-600">{proc.departamento || <span className="text-zinc-300">—</span>}</td>
                            <td className="p-3">
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => { setEditingProcId(proc.id); setEditingProcData({}); setAdminError(null); }}
                                  className="flex items-center gap-1 text-[10px] font-medium text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 px-2 py-1.5 rounded transition"
                                >
                                  <Pencil className="h-3 w-3" /> Editar
                                </button>
                                <button
                                  onClick={() => handleDeleteProc(proc.id)}
                                  className="flex items-center gap-1 text-[10px] font-medium text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2 py-1.5 rounded transition"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>

      {/* MODAL 1: QR CODE DISPLAY */}
      {showQrModal && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 border border-zinc-200 max-w-sm w-full text-center space-y-4 shadow-lg animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-zinc-900 text-sm">Escanea para Pagar por QR</h3>
              <button onClick={() => setShowQrModal(false)} className="text-zinc-400 hover:text-zinc-900 transition">
                <XCircle className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-zinc-50/60 p-4 rounded-lg border border-zinc-200 inline-block">
              <div className="w-48 h-48 bg-zinc-900 rounded-md flex flex-col items-center justify-center text-zinc-50 p-2">
                <QrCode className="h-32 w-32 text-zinc-50" />
                <span className="text-[10px] text-zinc-400 mt-2 font-mono">PLIN / YAPE CENTRO MEDIC</span>
              </div>
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full bg-zinc-900 hover:bg-zinc-900/90 text-zinc-50 font-medium py-2 rounded-md shadow transition text-xs"
            >
              CONFIRMAR PAGO DIGITAL
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: VISTA TÉRMICA DE IMPRESIÓN 80mm FORMAL */}
      {printedTicket && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 border border-zinc-200 max-w-md w-full space-y-4 shadow-lg animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-semibold text-zinc-900 text-xs flex items-center gap-2">
                <Printer className="h-4 w-4 text-zinc-800" /> Vista Previa Comprobante Clínico (80mm)
              </h3>
              <button onClick={() => setPrintedTicket(null)} className="text-zinc-400 hover:text-zinc-900 transition">
                <XCircle className="h-4 w-4" />
              </button>
            </div>

            {/* Printable Ticket Area */}
            <div
              id="printable-ticket"
              className="bg-white text-zinc-950 p-4 rounded-md font-mono text-xs space-y-2 border border-zinc-200 shadow-inner"
            >
              <div className="text-center font-bold text-sm">CENTRO MÉDICO MEDIC</div>
              <div className="text-center text-[10px]">RUC: 20601234567 • Tel: (044) 554433</div>
              <div className="text-center text-[10px]">Ciudad de Dios - Guadalupe - La Libertad</div>
              <div className="border-b border-dashed border-zinc-400 my-2"></div>

              <div className="text-center font-bold uppercase text-xs">
                {(printedTicket.tipoComprobante || (printedTicket.numeroBoleta ? 'BOLETA_ELECTRONICA' : 'TICKET_INTERNO')).replace('_ELECTRONICA', ' ELECTRÓNICA').replace('_INTERNO', ' INTERNO')}
              </div>
              <div className="text-center font-bold text-xs">{printedTicket.numeroBoleta || printedTicket.numeroTicket}</div>
              <div className="text-center text-[10px]">FECHA: {new Date(printedTicket.fecha).toLocaleString()}</div>
              <div className="border-b border-dashed border-zinc-400 my-1"></div>

              <div>PACIENTE: {printedTicket.paciente?.nombre}</div>
              <div>DOC. IDENT: {printedTicket.paciente?.numeroDocumento || 'S/N'}</div>
              <div>HIST. CLIN: {printedTicket.paciente?.numeroHistoriaClinica || 'N/A'}</div>
              <div>PROCEDENCIA: {printedTicket.paciente?.procedencia?.nombre || 'Ciudad de Dios'}</div>
              <div className="border-b border-dashed border-zinc-400 my-1"></div>

              <div>MÉDICO TRATANTE: {printedTicket.medico?.nombre}</div>
              <div>CMP: {printedTicket.medico?.cmp || 'S/N'}</div>
              <div>CONSULTORIO: {printedTicket.consultorio}</div>
              <div className="border-b border-dashed border-zinc-400 my-1"></div>

              <div className="font-bold border-b border-zinc-300 pb-1">DESCRIPCIÓN DE ATENCIONES:</div>
              {printedTicket.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-[11px]">
                  <span>{item.descripcion} (x{item.cantidad})</span>
                  <span>S/ {(item.precioUnitario * item.cantidad).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-b border-dashed border-zinc-400 my-1"></div>

              <div className="flex justify-between font-bold text-sm pt-1">
                <span>TOTAL A PAGAR:</span>
                <span>S/ {Number(printedTicket.montoPaciente).toFixed(2)}</span>
              </div>
              <div className="text-[10px]">MÉTODO DE PAGO: {printedTicket.metodoPago}</div>
              <div className="border-b border-dashed border-zinc-400 my-2"></div>

              <div className="text-center text-[10px] font-bold">¡Conserve este ticket para ser llamado a consultorio!</div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-zinc-900 hover:bg-zinc-900/90 text-zinc-50 font-medium py-2 rounded-md shadow transition text-xs flex items-center justify-center gap-2"
              >
                <Printer className="h-4 w-4" /> IMPRIMIR VOUCHER 80MM
              </button>
              <button
                onClick={() => setPrintedTicket(null)}
                className="px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-medium py-2 rounded-md border border-zinc-200 shadow-sm transition text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: HISTORIAL COMPLETO DE COMPROBANTES CON FILTROS */}
      {showHistoryModal && (() => {
        // Client-side filtering
        const filteredTickets = tickets.filter((t) => {
          // Search filter (patient name, ticket number, ruc)
          const searchLower = historySearch.toLowerCase().trim();
          if (searchLower) {
            const matchesPatient = t.paciente?.nombre?.toLowerCase().includes(searchLower);
            const matchesTicket = t.numeroTicket?.toLowerCase().includes(searchLower);
            const matchesBoleta = t.numeroBoleta?.toLowerCase().includes(searchLower);
            const matchesRuc = t.rucFactura?.toLowerCase().includes(searchLower);
            if (!matchesPatient && !matchesTicket && !matchesBoleta && !matchesRuc) return false;
          }

          // Doctor filter
          if (historyDoctorFilter && t.medicoId !== Number(historyDoctorFilter)) {
            return false;
          }

          // Payment method filter
          if (historyPaymentFilter && t.metodoPago !== historyPaymentFilter) {
            return false;
          }

          // Status filter
          if (historyStatusFilter && t.estado !== historyStatusFilter) {
            return false;
          }

          // Date filters
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

        // Pagination
        const itemsPerPage = 15;
        const totalItems = filteredTickets.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
        const currentPage = Math.min(historyCurrentPage, totalPages);
        const paginatedTickets = filteredTickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

        return (
          <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg border border-zinc-200 w-full max-w-5xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in-50 zoom-in-95">
              
              {/* Header */}
              <div className="px-6 py-4 border-b border-zinc-150 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-zinc-900" />
                  <div>
                    <h3 className="font-semibold text-zinc-900 text-sm">Historial Completo de Comprobantes</h3>
                    <p className="text-[11px] text-zinc-500">Mostrando {totalItems} registros coincidentes de un total de {tickets.length}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowHistoryModal(false)} 
                  className="text-zinc-400 hover:text-zinc-900 transition p-1 hover:bg-zinc-100 rounded-md"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Filters Bar */}
              <div className="bg-zinc-50/50 p-4 border-b border-zinc-150 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                
                {/* Search Term */}
                <div className="lg:col-span-2">
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Buscar Paciente / Ticket / RUC</label>
                  <input
                    type="text"
                    placeholder="Ej. Juan Perez, 2026-07-30..."
                    value={historySearch}
                    onChange={(e) => {
                      setHistorySearch(e.target.value);
                      setHistoryCurrentPage(1);
                    }}
                    className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                  />
                </div>

                {/* Doctor Select */}
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Médico Tratante</label>
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

                {/* Payment Method Select */}
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Método de Pago</label>
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

                {/* Status Select */}
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Estado</label>
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

                {/* Reset Filters Button */}
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => {
                      setHistorySearch('');
                      setHistoryDoctorFilter('');
                      setHistoryDateFrom('');
                      setHistoryDateTo('');
                      setHistoryPaymentFilter('');
                      setHistoryStatusFilter('');
                      setHistoryCurrentPage(1);
                    }}
                    className="h-8 w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold border border-zinc-200 rounded-md text-xs transition"
                  >
                    Limpiar Filtros
                  </button>
                </div>

                {/* Date range from */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Desde Fecha</label>
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

                {/* Date range to */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Hasta Fecha</label>
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

              {/* Table Area */}
              <div className="flex-1 overflow-y-auto min-h-[300px]">
                {paginatedTickets.length === 0 ? (
                  <div className="text-center py-20 text-zinc-400 text-xs">
                    No se encontraron comprobantes coincidentes con los filtros aplicados.
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
                        <tr key={t.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="p-3 pl-6">
                            <div className="font-mono font-semibold text-zinc-900">{t.numeroBoleta || t.numeroTicket}</div>
                            <div className="text-[10px] text-zinc-400 font-medium">
                              {(t.tipoComprobante || (t.numeroBoleta ? 'BOLETA_ELECTRONICA' : 'TICKET_INTERNO')).replace('_ELECTRONICA', '').replace('_INTERNO', '')}
                            </div>
                          </td>
                          <td className="p-3 text-zinc-500">
                            {new Date(t.fecha).toLocaleString()}
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-zinc-950">{t.paciente?.nombre}</div>
                            <div className="text-[10px] text-zinc-500">Doc: {t.paciente?.numeroDocumento || 'S/D'} • Cel: {t.paciente?.celular || 'S/N'}</div>
                          </td>
                          <td className="p-3 text-zinc-600">
                            <div>Dr. {t.medico?.nombre}</div>
                            <div className="text-[10px] text-zinc-400">{t.consultorio}</div>
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
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                              t.estado === 'ACTIVO' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              {t.estado}
                            </span>
                          </td>
                          <td className="p-3 pr-6 text-right space-x-1.5">
                            <button
                              onClick={() => {
                                setPrintedTicket(t);
                              }}
                              className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-650 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 px-2 py-1 rounded transition"
                            >
                              <Printer className="h-3 w-3" /> Imprimir
                            </button>
                            {t.estado === 'ACTIVO' && (
                              <button
                                onClick={() => handleAnularTicket(t.id)}
                                className="inline-flex items-center gap-1 text-[10px] font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 px-2 py-1 rounded transition"
                              >
                                Anular
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination Footer */}
              {totalPages > 1 && (
                <div className="px-6 py-3 border-t border-zinc-150 bg-zinc-50/50 flex items-center justify-between text-xs">
                  <div className="text-zinc-500">
                    Página <span className="font-semibold text-zinc-800">{currentPage}</span> de <span className="font-semibold text-zinc-800">{totalPages}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setHistoryCurrentPage(p => Math.max(1, p - 1))}
                      className="px-3 py-1 bg-white border border-zinc-200 rounded text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:hover:bg-white transition"
                    >
                      Anterior
                    </button>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setHistoryCurrentPage(p => Math.min(totalPages, p + 1))}
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
      })()}
      
      {/* CLOSE WRAPPER */}
    </div>
  );
}

export default App;
