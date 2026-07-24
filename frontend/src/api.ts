const API_BASE_URL = 'http://localhost:3000';

export interface Procedencia {
  id: number;
  nombre: string;
  distrito?: string;
  provincia?: string;
  departamento?: string;
}

export interface Paciente {
  id: number;
  nombre: string;
  tipoDocumento?: 'DNI' | 'CE' | 'PASAPORTE';
  numeroDocumento?: string;
  celular?: string;
  edad?: number;
  sexo?: 'M' | 'F';
  numeroHistoriaClinica?: string;
  procedenciaId: number;
  procedencia?: Procedencia;
}

export interface Medico {
  id: number;
  nombre: string;
  especialidad: string;
  grado: string;
  cmp?: string; // Colegiatura Médica del Perú
  rne?: string; // Registro Nacional de Especialista
  celular?: string;
  consultorioAsignado?: string;
}

export interface Tarifa {
  id: number;
  categoria: string;
  especialidad: string;
  descripcion: string;
  precioTotal: number;
  tipoReparto: string;
  comisionMedico: number;
  comisionClinica: number;
  requiereTecnico: boolean;
  comisionTecnico: number;
}

export interface CajaDiaria {
  id: number;
  fecha: string;
  montoApertura: number;
  montoEfectivoEsperado: number;
  montoEfectivoReal?: number;
  diferenciaCierre: number;
  montoDigitalEsperado: number;
  fechaApertura: string;
  fechaCierre?: string;
  abierta: boolean;
  observaciones?: string;
}

export type TipoComprobante = 'TICKET_INTERNO' | 'BOLETA_ELECTRONICA' | 'FACTURA_ELECTRONICA';
export type EstadoAtencion = 'ESPERA' | 'CONSULTORIO' | 'ATENDIDO' | 'CANCELADO';

export interface TicketItem {
  tarifaId: number;
  descripcion: string;
  precioUnitario: number;
  cantidad: number;
  comisionMedico: number;
  comisionClinica: number;
  comisionTecnico: number;
}

export interface Ticket {
  id: number;
  numeroTicket: string;
  numeroBoleta?: string;
  tipoComprobante: TipoComprobante;
  rucFactura?: string;
  razonSocialFactura?: string;
  direccionFactura?: string;
  fecha: string;
  pacienteId: number;
  paciente: Paciente;
  medicoId: number;
  medico: Medico;
  medicoSolicitanteId?: number;
  medicoSolicitante?: Medico;
  items: TicketItem[];
  tarifaId?: number;
  tarifa?: Tarifa;
  descripcionAdicional?: string;
  metodoPago: 'EFECTIVO' | 'PLIN' | 'TRANSFERENCIA' | 'TARJETA';
  montoPaciente: number;
  montoMedico: number;
  montoClinica: number;
  montoTecnico: number;
  nombreTecnico?: string;
  estado: 'ACTIVO' | 'ANULADO';
  estadoAtencion: EstadoAtencion;
  consultorio?: string;
  cajaDiariaId: number;
  cajaDiaria?: CajaDiaria;
  sunatProcesado: boolean;
  sunatError?: string;
  creadoEn: string;
}

export interface Egreso {
  id: number;
  fecha: string;
  tipoEgreso: 'GASTO' | 'PLANILLA' | 'PAGO_FIJO' | 'DEVOLUCION' | 'ASCENSOR' | 'OTROS';
  subcategoria?: string;
  numeroComprobante?: string;
  proveedor?: string;
  ruc?: string;
  observaciones: string;
  monto: number;
  cajaDiariaId: number;
}

// Datos iniciales precargados de Perú y clínica
export const INITIAL_PROCEDENCIAS: Procedencia[] = [
  { id: 1, nombre: 'Ciudad de Dios', distrito: 'Guadalupe', provincia: 'Pacasmayo', departamento: 'La Libertad' },
  { id: 2, nombre: 'Guadalupe', distrito: 'Guadalupe', provincia: 'Pacasmayo', departamento: 'La Libertad' },
  { id: 3, nombre: 'Chepén', distrito: 'Chepén', provincia: 'Chepén', departamento: 'La Libertad' },
  { id: 4, nombre: 'Tolón', distrito: 'Pacanga', provincia: 'Chepén', departamento: 'La Libertad' },
  { id: 5, nombre: 'Pacanguilla', distrito: 'Pacanga', provincia: 'Chepén', departamento: 'La Libertad' },
  { id: 6, nombre: 'Jaguey', distrito: 'San José', provincia: 'Pacasmayo', departamento: 'La Libertad' },
  { id: 7, nombre: 'Pueblo Nuevo', distrito: 'Pueblo Nuevo', provincia: 'Chepén', departamento: 'La Libertad' },
];

export const INITIAL_MEDICOS: Medico[] = [
  { id: 1, nombre: 'Dr. Joseph Cabanillas', especialidad: 'Medicina General', grado: 'Doctor', cmp: '078451', consultorioAsignado: 'Consultorio 1' },
  { id: 2, nombre: 'Dr. Carlos Sánchez', especialidad: 'Ginecología y Obstetricia', grado: 'Doctor', cmp: '054129', rne: '028941', consultorioAsignado: 'Consultorio 2' },
  { id: 3, nombre: 'Dra. María Fernandez', especialidad: 'Pediatría', grado: 'Doctora', cmp: '068912', rne: '031024', consultorioAsignado: 'Consultorio 3' },
  { id: 4, nombre: 'Dr. Randy Rebaza', especialidad: 'Cirugía General', grado: 'Doctor', cmp: '081203', rne: '040112', consultorioAsignado: 'SOP / Quirófano' },
  { id: 5, nombre: 'Lic. Samuel Placas', especialidad: 'Radiología & Imagenología', grado: 'Técnico', consultorioAsignado: 'Sala de Rayos X' },
];

export const INITIAL_TARIFAS: Tarifa[] = [
  { id: 1, categoria: 'Consulta', especialidad: 'Medicina General', descripcion: 'Consulta Médica General', precioTotal: 80, tipoReparto: 'PORCENTAJE', comisionMedico: 40, comisionClinica: 40, requiereTecnico: false, comisionTecnico: 0 },
  { id: 2, categoria: 'Consulta', especialidad: 'Ginecología', descripcion: 'Consulta Especializada Ginecología', precioTotal: 100, tipoReparto: 'PORCENTAJE', comisionMedico: 60, comisionClinica: 40, requiereTecnico: false, comisionTecnico: 0 },
  { id: 3, categoria: 'Ecografía', especialidad: 'Ginecología', descripcion: 'Ecografía Pélvica / Reno-Vesical', precioTotal: 120, tipoReparto: 'PORCENTAJE', comisionMedico: 70, comisionClinica: 50, requiereTecnico: false, comisionTecnico: 0 },
  { id: 4, categoria: 'Rayos X', especialidad: 'Radiología', descripcion: 'Toma de Rayos X (Placa Torácica/Extremidades)', precioTotal: 120, tipoReparto: 'MIXTO', comisionMedico: 20, comisionClinica: 95, requiereTecnico: true, comisionTecnico: 5 },
  { id: 5, categoria: 'SOP', especialidad: 'Cirugía', descripcion: 'Cirugía Ambulatoria Minor / SOP', precioTotal: 450, tipoReparto: 'PORCENTAJE', comisionMedico: 250, comisionClinica: 200, requiereTecnico: false, comisionTecnico: 0 },
  { id: 6, categoria: 'Certificado', especialidad: 'General', descripcion: 'Certificado Médico Oficial SUNAT/Trabajo', precioTotal: 50, tipoReparto: 'FIJO', comisionMedico: 10, comisionClinica: 40, requiereTecnico: false, comisionTecnico: 0 },
  { id: 7, categoria: 'Historia', especialidad: 'Administración', descripcion: 'Historia Clínica Copia Fedateada', precioTotal: 30, tipoReparto: 'FIJO', comisionMedico: 0, comisionClinica: 30, requiereTecnico: false, comisionTecnico: 0 },
];

const api = {
  async get<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}/${endpoint}`);
      if (!response.ok) throw new Error(`Error: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.warn(`[API GET Warning] Failed to fetch ${endpoint}.`);
      throw error;
    }
  },

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Error: ${response.statusText}`);
    return response.json();
  },

  async patch<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Error: ${response.statusText}`);
    return response.json();
  },

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(`Error: ${response.statusText}`);
    return response.json();
  },
};

export default api;
