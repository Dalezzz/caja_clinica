import React, { useEffect, useState } from 'react';
import {
  Stethoscope,
  UserCheck,
  CreditCard,
  QrCode,
  Printer,
  CheckCircle2,
  DollarSign,
  Building,
  FileText,
  UserPlus,
  Plus,
  Trash2,
} from 'lucide-react';
import api, {
  API_BASE_URL,
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
  buildHeaders,
} from './api';
import type { TabType } from './types';
import { AppSidebar } from './components/AppSidebar';
import { AppHeader } from './components/AppHeader';
import { PosOverviewPanel } from './components/PosOverviewPanel';
import { HistoryModal } from './components/HistoryModal';
import { QrCodeModal } from './components/QrCodeModal';
import { TicketPrintModal } from './components/TicketPrintModal';
import { QueuePanel } from './components/QueuePanel';
import { CashPanel } from './components/CashPanel';
import { ImporterPanel } from './components/ImporterPanel';
import { LiquidacionesPanel } from './components/LiquidacionesPanel';
import { TarifarioPanel } from './components/TarifarioPanel';
import { AdminPanel } from './components/AdminPanel';
import { AlquileresPanel } from './components/AlquileresPanel';
import { ComprobantesPanel } from './components/ComprobantesPanel';
import { EstadisticasPanel } from './components/EstadisticasPanel';
import { ReportesPanel } from './components/ReportesPanel';

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

  // (no auth UI)

  // no client routing for login

  // Add modals state for Admin create actions
  const [showAddMedico, setShowAddMedico] = useState(false);
  const [newMedicoData, setNewMedicoData] = useState<Partial<Medico>>({});
  const [newMedicoErrors, setNewMedicoErrors] = useState<Partial<Record<keyof Medico, string>>>({});
  const [showAddTarifa, setShowAddTarifa] = useState(false);
  const [newTarifaData, setNewTarifaData] = useState<Partial<Tarifa>>({ requiereTecnico: false });
  const [newTarifaErrors, setNewTarifaErrors] = useState<Partial<Record<keyof Tarifa, string>>>({});
  const [showAddProc, setShowAddProc] = useState(false);
  const [newProcData, setNewProcData] = useState<Partial<Procedencia>>({});
  const [newProcErrors, setNewProcErrors] = useState<Partial<Record<keyof Procedencia, string>>>({});

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

  const handleCreateMedico = async () => {
    // Validation
    const errors: Partial<Record<keyof Medico, string>> = {};
    if (!newMedicoData.nombre || newMedicoData.nombre.trim() === '') errors.nombre = 'Nombre es requerido';
    if (!newMedicoData.especialidad || newMedicoData.especialidad.trim() === '') errors.especialidad = 'Especialidad es requerida';
    if (!newMedicoData.grado || newMedicoData.grado.trim() === '') errors.grado = 'Grado es requerido';
    setNewMedicoErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setAdminSaving(true); setAdminError(null);
    try {
      const created = await api.post<Medico>('medicos', newMedicoData);
      setMedicos(prev => [created, ...prev]);
      setShowAddMedico(false);
      setNewMedicoData({});
      setAdminSuccess('Médico creado correctamente.');
      setTimeout(() => setAdminSuccess(null), 3000);
    } catch (err) {
      setAdminError('No se pudo crear el médico.');
    } finally { setAdminSaving(false); }
  };

  const handleCreateTarifa = async () => {
    // Validation
    const errors: Partial<Record<keyof Tarifa, string>> = {};
    if (!newTarifaData.categoria || String(newTarifaData.categoria).trim() === '') errors.categoria = 'Categoría es requerida';
    if (!newTarifaData.descripcion || String(newTarifaData.descripcion).trim() === '') errors.descripcion = 'Descripción es requerida';
    if (newTarifaData.precioTotal == null || Number.isNaN(Number(newTarifaData.precioTotal))) errors.precioTotal = 'Precio válido es requerido';
    if (newTarifaData.comisionMedico == null || Number.isNaN(Number(newTarifaData.comisionMedico))) errors.comisionMedico = 'Comisión médico válida es requerida';
    if (newTarifaData.comisionClinica == null || Number.isNaN(Number(newTarifaData.comisionClinica))) errors.comisionClinica = 'Comisión clínica válida es requerida';
    setNewTarifaErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setAdminSaving(true); setAdminError(null);
    try {
      const created = await api.post<Tarifa>('tarifas', newTarifaData);
      setTarifas(prev => [created, ...prev]);
      setShowAddTarifa(false);
      setNewTarifaData({ requiereTecnico: false });
      setAdminSuccess('Tarifa creada correctamente.');
      setTimeout(() => setAdminSuccess(null), 3000);
    } catch (err) {
      setAdminError('No se pudo crear la tarifa.');
    } finally { setAdminSaving(false); }
  };

  const handleCreateProc = async () => {
    // Validation
    const errors: Partial<Record<keyof Procedencia, string>> = {};
    if (!newProcData.nombre || String(newProcData.nombre).trim() === '') errors.nombre = 'Nombre es requerido';
    setNewProcErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setAdminSaving(true); setAdminError(null);
    try {
      const created = await api.post<Procedencia>('procedencias', newProcData);
      setProcedencias(prev => [created, ...prev]);
      setShowAddProc(false);
      setNewProcData({});
      setAdminSuccess('Procedencia creada correctamente.');
      setTimeout(() => setAdminSuccess(null), 3000);
    } catch (err) {
      setAdminError('No se pudo crear la procedencia.');
    } finally { setAdminSaving(false); }
  };

  const handleDryRun = async () => {
    if (!excelFile) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', excelFile);
      const response = await fetch(`${API_BASE_URL}/importar/excel?dryRun=true`, {
        method: 'POST',
        body: formData,
        headers: buildHeaders(),
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
      const response = await fetch(`${API_BASE_URL}/importar/excel?dryRun=false`, {
        method: 'POST',
        body: formData,
        headers: buildHeaders(),
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
          fetch(`${API_BASE_URL}/consultas/dni/${term}`, {
            headers: buildHeaders(),
          })
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
      fetch(`${API_BASE_URL}/consultas/ruc/${term}`, {
        headers: buildHeaders(),
      })
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
        items: cartItems.map((item) => ({
          tarifaId: item.tarifaId,
          descripcion: item.descripcion,
          precioUnitario: Number(item.precioUnitario),
          cantidad: Number(item.cantidad) || 1,
          comisionMedico: Number(item.comisionMedico),
          comisionClinica: Number(item.comisionClinica),
          comisionTecnico: Number(item.comisionTecnico),
        })),
        montoSolicitante: medicoSolicitanteId ? 20 : 0,
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
      <AppSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        ticketCount={tickets.filter((t) => caja && t.cajaDiariaId === caja.id && t.estadoAtencion !== 'ATENDIDO').length}
      />

      {/* no auth UI */}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <AppHeader activeTab={activeTab} caja={caja} currentTime={currentTime} onOpenCaja={handleOpenCaja} />

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

            <PosOverviewPanel
              tickets={tickets}
              onSelectTicket={(ticket: Ticket) => setPrintedTicket(ticket)}
              onOpenHistory={() => {
                setHistoryCurrentPage(1);
                setShowHistoryModal(true);
              }}
            />
          </div>
        )}

        {activeTab === 'cola' && (
          <QueuePanel
            tickets={tickets}
            caja={caja}
            onUpdateEstadoAtencion={handleUpdateEstadoAtencion}
          />
        )}

        {activeTab === 'cierre' && (
          <CashPanel
            activeTab="cierre"
            caja={caja}
            montoFisicoCierre={montoFisicoCierre}
            observacionesCierre={observacionesCierre}
            tipoEgreso={tipoEgreso}
            montoEgreso={montoEgreso}
            observacionEgreso={observacionEgreso}
            proveedorEgreso={proveedorEgreso}
            onMontoFisicoCierreChange={setMontoFisicoCierre}
            onObservacionesCierreChange={setObservacionesCierre}
            onCloseCaja={handleCloseCaja}
            onTipoEgresoChange={setTipoEgreso}
            onMontoEgresoChange={setMontoEgreso}
            onObservacionEgresoChange={setObservacionEgreso}
            onProveedorEgresoChange={setProveedorEgreso}
            onCreateEgreso={(e) => handleCreateEgreso(e)}
          />
        )}

        {activeTab === 'egresos' && (
          <CashPanel
            activeTab="egresos"
            caja={caja}
            montoFisicoCierre={montoFisicoCierre}
            observacionesCierre={observacionesCierre}
            tipoEgreso={tipoEgreso}
            montoEgreso={montoEgreso}
            observacionEgreso={observacionEgreso}
            proveedorEgreso={proveedorEgreso}
            onMontoFisicoCierreChange={setMontoFisicoCierre}
            onObservacionesCierreChange={setObservacionesCierre}
            onCloseCaja={handleCloseCaja}
            onTipoEgresoChange={setTipoEgreso}
            onMontoEgresoChange={setMontoEgreso}
            onObservacionEgresoChange={setObservacionEgreso}
            onProveedorEgresoChange={setProveedorEgreso}
            onCreateEgreso={(e) => handleCreateEgreso(e)}
          />
        )}

        {activeTab === 'importer' && (
          <ImporterPanel
            excelFile={excelFile}
            importing={importing}
            dryRunData={dryRunData}
            onFileChange={setExcelFile}
            onDryRun={handleDryRun}
            onConfirmImport={handleConfirmImport}
          />
        )}

        {activeTab === 'liquidaciones' && (
          <LiquidacionesPanel
            medicos={medicos}
            tickets={tickets}
            liqSearch={liqSearch}
            liqSpecialty={liqSpecialty}
            liqDateFrom={liqDateFrom}
            liqDateTo={liqDateTo}
            onLiqSearchChange={setLiqSearch}
            onLiqSpecialtyChange={setLiqSpecialty}
            onLiqDateFromChange={setLiqDateFrom}
            onLiqDateToChange={setLiqDateTo}
            onResetFilters={() => {
              setLiqSearch('');
              setLiqSpecialty('');
              setLiqDateFrom('');
              setLiqDateTo('');
            }}
          />
        )}

        {activeTab === 'tarifario' && (
          <TarifarioPanel
            tarifas={tarifas}
            tarSearch={tarSearch}
            tarCategory={tarCategory}
            onTarSearchChange={setTarSearch}
            onTarCategoryChange={setTarCategory}
            onResetFilters={() => {
              setTarSearch('');
              setTarCategory('');
            }}
          />
        )}

        {activeTab === 'alquileres' && (
          <AlquileresPanel />
        )}

        {activeTab === 'comprobantes' && (
          <ComprobantesPanel medicos={medicos} />
        )}

        {activeTab === 'estadisticas' && (
          <EstadisticasPanel medicos={medicos} />
        )}

        {activeTab === 'reportes' && (
          <ReportesPanel />
        )}

        {activeTab === 'admin' && (
          <AdminPanel
            medicos={medicos}
            tarifas={tarifas}
            procedencias={procedencias}
            adminSaving={adminSaving}
            adminError={adminError}
            adminSuccess={adminSuccess}
            editingMedicoId={editingMedicoId}
            editingMedicoData={editingMedicoData}
            editingTarifaId={editingTarifaId}
            editingTarifaData={editingTarifaData}
            editingProcId={editingProcId}
            editingProcData={editingProcData}
            showAddMedico={showAddMedico}
            newMedicoData={newMedicoData}
            newMedicoErrors={newMedicoErrors}
            showAddTarifa={showAddTarifa}
            newTarifaData={newTarifaData}
            newTarifaErrors={newTarifaErrors}
            showAddProc={showAddProc}
            newProcData={newProcData}
            newProcErrors={newProcErrors}
            onSetEditingMedicoId={setEditingMedicoId}
            onSetEditingMedicoData={setEditingMedicoData}
            onSetEditingTarifaId={setEditingTarifaId}
            onSetEditingTarifaData={setEditingTarifaData}
            onSetEditingProcId={setEditingProcId}
            onSetEditingProcData={setEditingProcData}
            onSetShowAddMedico={setShowAddMedico}
            onSetNewMedicoData={setNewMedicoData}
            onSetNewMedicoErrors={setNewMedicoErrors}
            onSetShowAddTarifa={setShowAddTarifa}
            onSetNewTarifaData={setNewTarifaData}
            onSetNewTarifaErrors={setNewTarifaErrors}
            onSetShowAddProc={setShowAddProc}
            onSetNewProcData={setNewProcData}
            onSetNewProcErrors={setNewProcErrors}
            onSetAdminError={setAdminError}
            onSaveMedico={handleSaveMedico}
            onDeleteMedico={handleDeleteMedico}
            onSaveTarifa={handleSaveTarifa}
            onDeleteProc={handleDeleteProc}
            onSaveProc={handleSaveProc}
            onCreateMedico={handleCreateMedico}
            onCreateTarifa={handleCreateTarifa}
            onCreateProc={handleCreateProc}
          />
        )}
      </main>
    </div>

      <QrCodeModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
      />

      <TicketPrintModal
        ticket={printedTicket}
        onClose={() => setPrintedTicket(null)}
      />

      <HistoryModal
        tickets={tickets}
        medicos={medicos}
        isOpen={showHistoryModal}
        historySearch={historySearch}
        historyDoctorFilter={historyDoctorFilter}
        historyDateFrom={historyDateFrom}
        historyDateTo={historyDateTo}
        historyPaymentFilter={historyPaymentFilter}
        historyStatusFilter={historyStatusFilter}
        historyCurrentPage={historyCurrentPage}
        onClose={() => setShowHistoryModal(false)}
        setHistorySearch={setHistorySearch}
        setHistoryDoctorFilter={setHistoryDoctorFilter}
        setHistoryDateFrom={setHistoryDateFrom}
        setHistoryDateTo={setHistoryDateTo}
        setHistoryPaymentFilter={setHistoryPaymentFilter}
        setHistoryStatusFilter={setHistoryStatusFilter}
        setHistoryCurrentPage={setHistoryCurrentPage}
        onPrintTicket={(ticket) => setPrintedTicket(ticket)}
        onAnularTicket={handleAnularTicket}
      />
      
      {/* CLOSE WRAPPER */}
    </div>
  );
}

export default App;
