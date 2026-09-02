export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

const TOKEN_KEY = "caja_clinica_token";

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    return;
  }

  localStorage.removeItem(TOKEN_KEY);
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

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
  tipoDocumento?: "DNI" | "CE" | "PASAPORTE";
  numeroDocumento?: string;
  celular?: string;
  edad?: number;
  sexo?: "M" | "F";
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

export type TipoComprobante =
  "TICKET_INTERNO" | "BOLETA_ELECTRONICA" | "FACTURA_ELECTRONICA";
export type EstadoAtencion =
  "ESPERA" | "CONSULTORIO" | "ATENDIDO" | "CANCELADO";
export type MetodoPagoValue = "EFECTIVO" | "PLIN" | "TRANSFERENCIA" | "TARJETA";

export interface TicketItem {
  id?: number;
  tarifaId: number;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  comisionMedico: number;
  comisionClinica: number;
  comisionTecnico: number;
  tarifa?: Tarifa;
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
  metodoPago: MetodoPagoValue;
  montoPaciente: number;
  montoMedico: number;
  montoClinica: number;
  montoTecnico: number;
  nombreTecnico?: string;
  estado: "ACTIVO" | "ANULADO";
  estadoAtencion: EstadoAtencion;
  consultorio?: string;
  cajaDiariaId: number;
  cajaDiaria?: CajaDiaria;
  sunatEstado?: "PENDIENTE" | "EMITIDO" | "ERROR";
  sunatError?: string;
  sunatPdfPath?: string;
  sunatXmlPath?: string;
  creadoEn: string;
}

export interface Egreso {
  id: number;
  fecha: string;
  tipoEgreso:
    "GASTO" | "PLANILLA" | "PAGO_FIJO" | "DEVOLUCION" | "ASCENSOR" | "OTROS";
  subcategoria?: string;
  numeroComprobante?: string;
  proveedor?: string;
  ruc?: string;
  observaciones: string;
  monto: number;
  cajaDiariaId: number;
}

export interface AlquilerEspacio {
  id: number;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  precioTotal: number;
  estado: "ACTIVO" | "FINALIZADO" | "CANCELADO";
  arrendatario: string;
  contacto?: string;
  observaciones?: string;
  cajaDiariaId: number;
  usuarioCreadorId: number;
  creadoEn: string;
}

export interface ComprobantePagoMedico {
  id: number;
  correlativoMedico?: number;
  medicoId: number;
  medico?: Medico;
  fecha: string;
  periodoInicio: string;
  periodoFin: string;
  montoTotal: number;
  montoDescuento: number;
  montoNeto: number;
  cantidadServicios: number;
  estado: "BORRADOR" | "FIRMADO" | "CANCELADO";
  firmaDigital?: string;
  documentoPdfPath?: string;
  observaciones?: string;
  cajaDiariaId?: number;
  usuarioCreadorId: number;
  creadoEn: string;
  actualizadoEn?: string;
  tickets?: Array<{
    id: number;
    numeroTicket: string;
    paciente: string;
    tarifa: string;
    monto: number;
    comisionMedico: number;
  }>;
}

export interface Ajustes {
  whatsappEnabled: boolean;
  whatsappNumeroNegocio: string;
  whatsappGerentes: string;
  whatsappProvider: "twilio" | "whatsapp_business" | "custom_api" | "dummy";
  whatsappToken: string;
  whatsappApiUrl: string;
  whatsappCronTime: string;
  whatsappFrecuencia: string;
  whatsappAlCierre: boolean;
  
  // SUNAT
  sunatRuc?: string;
  sunatUsuario?: string;
  sunatClave?: string;
  sunatAutoEmitir?: boolean;
  
  actualizadoEn?: string;
}

export interface EstadisticaMedicoMensual {
  medicoId: number;
  nombreMedico: string;
  mes: number;
  anio: number;
  totalServicios: number;
  montoPaciente: number;
  montoMedico: number;
  montoClinica: number;
  porcentajeGeneral: number;
  especialidad?: string;
}

export interface RankingMedicos {
  puesto: number;
  medicoId: number;
  nombreMedico: string;
  montoPaciente: number;
  montoMedico: number;
  servicios: number;
  especialidad: string;
}

// Datos iniciales precargados de Perú y clínica
export const INITIAL_PROCEDENCIAS: Procedencia[] = [
  {
    id: 1,
    nombre: "Ciudad de Dios",
    distrito: "Guadalupe",
    provincia: "Pacasmayo",
    departamento: "La Libertad",
  },
  {
    id: 2,
    nombre: "Guadalupe",
    distrito: "Guadalupe",
    provincia: "Pacasmayo",
    departamento: "La Libertad",
  },
  {
    id: 3,
    nombre: "Chepén",
    distrito: "Chepén",
    provincia: "Chepén",
    departamento: "La Libertad",
  },
  {
    id: 4,
    nombre: "Tolón",
    distrito: "Pacanga",
    provincia: "Chepén",
    departamento: "La Libertad",
  },
  {
    id: 5,
    nombre: "Pacanguilla",
    distrito: "Pacanga",
    provincia: "Chepén",
    departamento: "La Libertad",
  },
  {
    id: 6,
    nombre: "Jaguey",
    distrito: "San José",
    provincia: "Pacasmayo",
    departamento: "La Libertad",
  },
  {
    id: 7,
    nombre: "Pueblo Nuevo",
    distrito: "Pueblo Nuevo",
    provincia: "Chepén",
    departamento: "La Libertad",
  },
];

export const INITIAL_MEDICOS: Medico[] = [
  {
    id: 1,
    nombre: "Dr. Joseph Cabanillas",
    especialidad: "Medicina General",
    grado: "Doctor",
    cmp: "078451",
    consultorioAsignado: "Consultorio 1",
  },
  {
    id: 2,
    nombre: "Dr. Carlos Sánchez",
    especialidad: "Ginecología y Obstetricia",
    grado: "Doctor",
    cmp: "054129",
    rne: "028941",
    consultorioAsignado: "Consultorio 2",
  },
  {
    id: 3,
    nombre: "Dra. María Fernandez",
    especialidad: "Pediatría",
    grado: "Doctora",
    cmp: "068912",
    rne: "031024",
    consultorioAsignado: "Consultorio 3",
  },
  {
    id: 4,
    nombre: "Dr. Randy Rebaza",
    especialidad: "Cirugía General",
    grado: "Doctor",
    cmp: "081203",
    rne: "040112",
    consultorioAsignado: "SOP / Quirófano",
  },
  {
    id: 5,
    nombre: "Lic. Samuel Placas",
    especialidad: "Radiología & Imagenología",
    grado: "Técnico",
    consultorioAsignado: "Sala de Rayos X",
  },
];

export const INITIAL_TARIFAS: Tarifa[] = [
  {
    id: 1,
    categoria: "Consulta",
    especialidad: "Medicina General",
    descripcion: "Consulta Médica General",
    precioTotal: 80,
    tipoReparto: "PORCENTAJE",
    comisionMedico: 40,
    comisionClinica: 40,
    requiereTecnico: false,
    comisionTecnico: 0,
  },
  {
    id: 2,
    categoria: "Consulta",
    especialidad: "Ginecología",
    descripcion: "Consulta Especializada Ginecología",
    precioTotal: 100,
    tipoReparto: "PORCENTAJE",
    comisionMedico: 60,
    comisionClinica: 40,
    requiereTecnico: false,
    comisionTecnico: 0,
  },
  {
    id: 3,
    categoria: "Ecografía",
    especialidad: "Ginecología",
    descripcion: "Ecografía Pélvica / Reno-Vesical",
    precioTotal: 120,
    tipoReparto: "PORCENTAJE",
    comisionMedico: 70,
    comisionClinica: 50,
    requiereTecnico: false,
    comisionTecnico: 0,
  },
  {
    id: 4,
    categoria: "Rayos X",
    especialidad: "Radiología",
    descripcion: "Toma de Rayos X (Placa Torácica/Extremidades)",
    precioTotal: 120,
    tipoReparto: "MIXTO",
    comisionMedico: 20,
    comisionClinica: 95,
    requiereTecnico: true,
    comisionTecnico: 5,
  },
  {
    id: 5,
    categoria: "SOP",
    especialidad: "Cirugía",
    descripcion: "Cirugía Ambulatoria Minor / SOP",
    precioTotal: 450,
    tipoReparto: "PORCENTAJE",
    comisionMedico: 250,
    comisionClinica: 200,
    requiereTecnico: false,
    comisionTecnico: 0,
  },
  {
    id: 6,
    categoria: "Certificado",
    especialidad: "General",
    descripcion: "Certificado Médico Oficial SUNAT/Trabajo",
    precioTotal: 50,
    tipoReparto: "FIJO",
    comisionMedico: 10,
    comisionClinica: 40,
    requiereTecnico: false,
    comisionTecnico: 0,
  },
  {
    id: 7,
    categoria: "Historia",
    especialidad: "Administración",
    descripcion: "Historia Clínica Copia Fedateada",
    precioTotal: 30,
    tipoReparto: "FIJO",
    comisionMedico: 0,
    comisionClinica: 30,
    requiereTecnico: false,
    comisionTecnico: 0,
  },
];

export const buildHeaders = (contentType = false): Record<string, string> => {
  const headers: Record<string, string> = {};
  const token = getAuthToken();

  if (contentType) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const api = {
  async get<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        headers: buildHeaders(),
      });
      if (response.status === 401) {
        throw new Error("Unauthorized");
      }
      if (!response.ok) throw new Error(`Error: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.warn(`[API GET Warning] Failed to fetch ${endpoint}.`);
      throw error;
    }
  },

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method: "POST",
      headers: buildHeaders(true),
      body: JSON.stringify(data),
    });
    if (response.status === 401) {
      throw new Error("Unauthorized");
    }
    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      throw new Error(errData?.message || `Error: ${response.statusText}`);
    }
    return response.json();
  },

  async patch<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method: "PATCH",
      headers: buildHeaders(true),
      body: JSON.stringify(data),
    });
    if (response.status === 401) {
      throw new Error("Unauthorized");
    }
    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      throw new Error(errData?.message || `Error: ${response.statusText}`);
    }
    return response.json();
  },

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method: "DELETE",
      headers: buildHeaders(),
    });
    if (response.status === 401) {
      throw new Error("Unauthorized");
    }
    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      throw new Error(errData?.message || `Error: ${response.statusText}`);
    }
    return response.json();
  },

  async login<T>(usuario: string, contrasena: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, contrasena }),
    });

    if (!response.ok) {
      throw new Error("Credenciales inválidas");
    }

    return response.json();
  },

  // Tickets
  async actualizarEstadoTicket(
    id: number,
    estadoAtencion: EstadoAtencion,
  ): Promise<Ticket> {
    return this.patch(`tickets/${id}`, { estadoAtencion });
  },

  // Alquileres
  async crearAlquiler(alquiler: any): Promise<AlquilerEspacio> {
    return this.post("alquileres", alquiler);
  },

  async obtenerAlquileres(): Promise<AlquilerEspacio[]> {
    return this.get("alquileres");
  },

  async obtenerAlquilerActivos(): Promise<AlquilerEspacio[]> {
    return this.get("alquileres/activos/list");
  },

  async finalizarAlquiler(id: number): Promise<AlquilerEspacio> {
    return this.patch(`alquileres/${id}/finalizar`, {});
  },

  async cancelarAlquiler(id: number): Promise<AlquilerEspacio> {
    return this.patch(`alquileres/${id}/cancelar`, {});
  },

  // Comprobantes de Pago Médico
  async crearComprobantePago(comprobante: any): Promise<ComprobantePagoMedico> {
    return this.post("comprobantes-pago-medicos", comprobante);
  },

  async generarComprobanteDia(
    medicoId: number,
  ): Promise<ComprobantePagoMedico> {
    return this.post(`comprobantes-pago-medicos/generar-dia/${medicoId}`, {});
  },

  async obtenerComprobantes(): Promise<ComprobantePagoMedico[]> {
    return this.get("comprobantes-pago-medicos");
  },

  async obtenerComprobantesPorMedico(
    medicoId: number,
  ): Promise<ComprobantePagoMedico[]> {
    return this.get(`comprobantes-pago-medicos/medico/${medicoId}`);
  },

  async obtenerComprobante(id: number): Promise<ComprobantePagoMedico> {
    return this.get(`comprobantes-pago-medicos/${id}`);
  },

  async firmarComprobante(
    id: number,
    firmaDigital: string,
  ): Promise<ComprobantePagoMedico> {
    return this.patch(`comprobantes-pago-medicos/${id}/firmar`, {
      firmaDigital,
    });
  },

  async descargarComprobantePDF(id: number): Promise<Blob> {
    const response = await fetch(
      `${API_BASE_URL}/comprobantes-pago-medicos/${id}/descargar-pdf`,
      {
        headers: buildHeaders(),
      },
    );
    if (!response.ok)
      throw new Error(`Error al descargar PDF: ${response.statusText}`);
    return response.blob();
  },

  async cancelarComprobante(id: number): Promise<ComprobantePagoMedico> {
    return this.patch(`comprobantes-pago-medicos/${id}/cancelar`, {});
  },

  // Estadísticas de Médicos
  async obtenerEstadisticaMensual(
    mes: number,
    anio: number,
  ): Promise<EstadisticaMedicoMensual[]> {
    return this.get(`estadisticas-medicos/mensual/${mes}/${anio}`);
  },

  async obtenerRankingMedicos(
    mes: number,
    anio: number,
  ): Promise<RankingMedicos[]> {
    return this.get(`estadisticas-medicos/ranking/${mes}/${anio}`);
  },

  async obtenerComparativaAnual(
    medicoId: number,
    anio: number,
  ): Promise<any[]> {
    return this.get(`estadisticas-medicos/anual/${medicoId}/${anio}`);
  },

  async obtenerCrecimientoMedico(
    medicoId: number,
    mes: number,
    anio: number,
  ): Promise<any> {
    return this.get(
      `estadisticas-medicos/crecimiento/${medicoId}/${mes}/${anio}`,
    );
  },

  // Reportes WhatsApp
  async enviarReporteDia(): Promise<any> {
    return this.post("reportes/whatsapp/dia", {});
  },

  async enviarReporteMensual(mes: number, anio: number): Promise<any> {
    return this.post("reportes/whatsapp/mensual", { mes, anio });
  },

  async obtenerAjustes(): Promise<Ajustes> {
    return this.get("reportes/configuracion");
  },

  async guardarAjustes(
    ajustes: Partial<Ajustes>,
  ): Promise<Ajustes> {
    return this.patch("reportes/configuracion", ajustes);
  },

  async getWhatsappStatus(): Promise<{ status: string; qr?: string }> {
    return this.get("whatsapp/status");
  },

  async whatsappLogout(): Promise<{ success: boolean }> {
    return this.post("whatsapp/logout", {});
  },

  async getMissedReports(): Promise<any> {
    return this.get("whatsapp/missed");
  },

  async sendMissedReports(): Promise<any> {
    return this.post("whatsapp/send-missed", {});
  },

  // SUNAT
  async emitirBoletaSunat(ticketId: number): Promise<any> {
    return this.post(`sunat/emitir/${ticketId}`, {});
  },

  descargarBoletaPdfUrl(ticketId: number): string {
    return `${API_BASE_URL}/sunat/descargar-pdf/${ticketId}`;
  },

  // FARMACIA
  async getProductos(busqueda?: string, categoria?: string): Promise<Producto[]> {
    const params = new URLSearchParams();
    if (busqueda) params.set("busqueda", busqueda);
    if (categoria) params.set("categoria", categoria);
    const qs = params.toString();
    return this.get(`farmacia/productos${qs ? `?${qs}` : ""}`);
  },

  async getCategoriasFarmacia(): Promise<string[]> {
    return this.get("farmacia/categorias");
  },

  async getProductoById(id: number): Promise<ProductoConKardex> {
    return this.get(`farmacia/productos/${id}`);
  },

  async createProducto(data: Omit<Producto, "id" | "creadoEn" | "actualizadoEn" | "_count">): Promise<Producto> {
    return this.post("farmacia/productos", data);
  },

  async updateProducto(id: number, data: Partial<Omit<Producto, "id">>): Promise<Producto> {
    return this.patch(`farmacia/productos/${id}`, data);
  },

  async registrarMovimientoKardex(data: {
    productoId: number;
    tipo: "ENTRADA" | "SALIDA" | "AJUSTE";
    cantidad: number;
    motivo?: string;
  }): Promise<MovimientoKardex> {
    return this.post("farmacia/movimiento", data);
  },

  async importarExcelFarmacia(
    archivo: File,
    contexto: "clinica" | "farmacia" = "farmacia"
  ): Promise<{ importados: number; productos: number; errores: string[] }> {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append("archivo", archivo);
    const res = await fetch(
      `${API_BASE_URL}/farmacia/importar?contexto=${contexto}`,
      {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || "Error al importar el archivo");
    }
    return res.json();
  },

  // INVENTARIO GENERAL Y ACTIVOS FIJOS
  async getUbicaciones(busqueda?: string, tipo?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (busqueda) params.set("busqueda", busqueda);
    if (tipo) params.set("tipo", tipo);
    const qs = params.toString();
    return this.get(`inventario-general/ubicaciones${qs ? `?${qs}` : ""}`);
  },

  async getActivosFijos(busqueda?: string, estado?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (busqueda) params.set("busqueda", busqueda);
    if (estado) params.set("estado", estado);
    const qs = params.toString();
    return this.get(`inventario-general/activos${qs ? `?${qs}` : ""}`);
  },

  async getEstadisticasInventario(): Promise<any> {
    return this.get("inventario-general/estadisticas");
  },

  async crearActivoFijo(data: any): Promise<any> {
    return this.post("inventario-general/activos", data);
  },

  async trasladarActivoFijo(id: number, data: any): Promise<any> {
    return this.post(`inventario-general/activos/${id}/trasladar`, data);
  },

  async importarInventarioGeneralExcel(archivo: File, force: boolean = false): Promise<any> {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append("file", archivo);
    const res = await fetch(
      `${API_BASE_URL}/importar/inventario-general?dryRun=false${force ? "&force=true" : ""}`,
      {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || "Error al importar inventario general");
    }
    return res.json();
  },
};

export default api;

// ── Farmacia Types ───────────────────────────────────────────
export interface Producto {
  id: number;
  nombre: string;
  detalle?: string;
  categoria: string;
  stockActual: number;
  unidadMedida: string;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
  _count?: { movimientos: number };
}

export interface MovimientoKardex {
  id: number;
  productoId: number;
  fecha: string;
  tipo: "ENTRADA" | "SALIDA" | "AJUSTE";
  cantidad: number;
  saldoResultante: number;
  motivo?: string;
  ticketId?: number;
  creadoEn: string;
}

export interface ProductoConKardex extends Producto {
  movimientos: MovimientoKardex[];
}
