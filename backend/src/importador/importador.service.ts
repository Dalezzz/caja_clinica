import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as XLSX from 'xlsx';
import {
  cleanDoctorName,
  cleanName,
  standardizeCategory,
  standardizeSpecialty,
} from './importador-normalizers';

@Injectable()
export class ImportadorService {
  constructor(private prisma: PrismaService) {}

  private cleanName(name: string): string {
    return cleanName(name);
  }

  private cleanDoctorName(name: string): string {
    return cleanDoctorName(name);
  }

  private standardizeSpecialty(esp: string): string {
    return standardizeSpecialty(esp);
  }

  private standardizeCategory(cat: string): string {
    return standardizeCategory(cat);
  }

  async importarExcel(fileBuffer: Buffer, dryRun: boolean) {
    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true });
    } catch (error) {
      throw new BadRequestException('El archivo subido no es un Excel válido.');
    }

    // Listar las hojas del Excel
    const sheetNames = workbook.SheetNames;

    // Buscar las hojas de interés de forma tolerante
    const findSheet = (keywords: string[]) => {
      return sheetNames.find((name) =>
        keywords.some((k) => name.toUpperCase().includes(k)),
      );
    };

    const consultasSheet = findSheet(['CONSULTAS']);
    const ecografiasSheet = findSheet(['ECOGRAFIAS']);
    const rayosxSheet = findSheet(['RAYOS X', 'RAYOS']);
    const certificadosSheet = findSheet(['CERTIFICADOS']);
    const serviciosSheet = findSheet(['SERVICIOS']);
    const egresosSheet = findSheet(['EGRESOS']);
    const dietasSheet = findSheet(['DIETAS']);

    // Cargar catálogos actuales de la base de datos
    const dbMedicos = await this.prisma.medico.findMany();
    const dbProcedencias = await this.prisma.procedencia.findMany();
    const dbTarifas = await this.prisma.tarifa.findMany();

    const medicosMap = new Map<string, any>();
    dbMedicos.forEach((m) => medicosMap.set(m.nombre.toUpperCase(), m));

    const procedenciasMap = new Map<string, any>();
    dbProcedencias.forEach((p) =>
      procedenciasMap.set(p.nombre.toUpperCase(), p),
    );

    const tarifasMap = new Map<string, any>();
    dbTarifas.forEach((t) =>
      tarifasMap.set(
        `${t.categoria.toUpperCase()}|${t.especialidad.toUpperCase()}`,
        t,
      ),
    );

    // Listas temporales de elementos nuevos detectados
    const nuevosMedicos = new Set<string>();
    const nuevasProcedencias = new Set<string>();
    const nuevasTarifas = new Set<string>();

    const ticketsAImportar: any[] = [];
    const egresosAImportar: any[] = [];
    const dietasAImportar: any[] = [];

    // --- 1. PARSEAR HOJA: CONSULTAS ---
    if (consultasSheet) {
      const sheet = workbook.Sheets[consultasSheet];
      const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
      // Las cabeceras reales están en la fila 3 (index 3)
      // Los datos empiezan en la fila 4 (index 4)
      for (let i = 4; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;
        const ticketNum = row[1];
        const pacienteName = row[3];
        if (
          !ticketNum ||
          !pacienteName ||
          String(pacienteName).toUpperCase() === 'TOTAL'
        )
          continue;

        const fechaRaw = row[0];
        const fecha = this.parseDate(fechaRaw);
        const boleta = row[2] ? String(row[2]).trim() : null;
        const grado = row[4] ? String(row[4]).trim() : 'Doctor';
        const medicoName = cleanDoctorName(String(row[5] || ''));
        const especialidad = standardizeSpecialty(row[6] ? String(row[6]) : '');
        const obs = row[7] ? String(row[7]).trim() : 'Consulta';
        const celular = row[8] ? String(row[8]).trim() : null;
        const procedencia = row[9] ? String(row[9]).trim() : 'Ciudad de Dios';

        const montoPaciente = Number(row[10] || 0);
        const montoMedico = Number(row[11] || 0);
        const montoClinica = Number(row[12] || 0);

        if (pacienteName === 'ANULADO') {
          // Agregar ticket anulado
          ticketsAImportar.push({
            numeroTicket: String(ticketNum),
            numeroBoleta: boleta,
            fecha,
            pacienteNombre: 'ANULADO',
            celular: null,
            procedenciaNombre: 'Ciudad de Dios',
            medicoNombre: 'Médico General',
            grado: 'Doctor',
            especialidad: 'Medicina General',
            descripcionAdicional: 'Consulta Anulada',
            montoPaciente: 0,
            montoMedico: 0,
            montoClinica: 0,
            montoTecnico: 0,
            nombreTecnico: null,
            estado: 'ANULADO',
          });
          continue;
        }

        // Registrar médicos/procedencias nuevos
        if (medicoName && !medicosMap.has(medicoName.toUpperCase())) {
          nuevosMedicos.add(medicoName);
        }
        if (procedencia && !procedenciasMap.has(procedencia.toUpperCase())) {
          nuevasProcedencias.add(procedencia);
        }

        const tarifaKey = `CONSULTA|${especialidad.toUpperCase()}`;
        if (!tarifasMap.has(tarifaKey)) {
          nuevasTarifas.add(tarifaKey);
        }

        ticketsAImportar.push({
          numeroTicket: String(ticketNum),
          numeroBoleta: boleta,
          fecha,
          pacienteNombre: this.cleanName(pacienteName),
          celular,
          procedenciaNombre: procedencia,
          medicoNombre: medicoName || 'Médico General',
          grado,
          especialidad,
          descripcionAdicional: obs,
          montoPaciente,
          montoMedico,
          montoClinica,
          montoTecnico: 0,
          nombreTecnico: null,
          estado: 'ACTIVO',
        });
      }
    }

    // --- 2. PARSEAR HOJA: ECOGRAFIAS ---
    if (ecografiasSheet) {
      const sheet = workbook.Sheets[ecografiasSheet];
      const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
      for (let i = 4; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;
        const ticketNum = row[1];
        const pacienteName = row[3];
        if (
          !ticketNum ||
          !pacienteName ||
          String(pacienteName).toUpperCase() === 'TOTAL'
        )
          continue;

        const fechaRaw = row[0];
        const fecha = this.parseDate(fechaRaw);
        const boleta = row[2] ? String(row[2]).trim() : null;
        const grado = row[4] ? String(row[4]).trim() : 'Doctor';
        const medicoName = cleanDoctorName(String(row[5] || ''));
        const especialidad = standardizeSpecialty(
          row[6] ? String(row[6]) : 'Ginecología',
        );
        const tipoEco = row[7] ? String(row[7]).trim() : 'Ecografía';
        const celular = row[8] ? String(row[8]).trim() : null;
        const procedencia = row[9] ? String(row[9]).trim() : 'Ciudad de Dios';

        const montoPaciente = Number(row[10] || 0);
        const montoMedico = Number(row[11] || 0);
        const montoClinica = Number(row[12] || 0);

        if (pacienteName === 'ANULADO') {
          ticketsAImportar.push({
            numeroTicket: String(ticketNum),
            numeroBoleta: boleta,
            fecha,
            pacienteNombre: 'ANULADO',
            celular: null,
            procedenciaNombre: 'Ciudad de Dios',
            medicoNombre: 'Médico General',
            grado: 'Doctor',
            especialidad: 'Ecografía',
            descripcionAdicional: 'Ecografía Anulada',
            montoPaciente: 0,
            montoMedico: 0,
            montoClinica: 0,
            montoTecnico: 0,
            nombreTecnico: null,
            estado: 'ANULADO',
          });
          continue;
        }

        if (medicoName && !medicosMap.has(medicoName.toUpperCase())) {
          nuevosMedicos.add(medicoName);
        }
        if (procedencia && !procedenciasMap.has(procedencia.toUpperCase())) {
          nuevasProcedencias.add(procedencia);
        }

        const tarifaKey = `ECOGRAFÍA|${especialidad.toUpperCase()}`;
        if (!tarifasMap.has(tarifaKey)) {
          nuevasTarifas.add(tarifaKey);
        }

        ticketsAImportar.push({
          numeroTicket: String(ticketNum),
          numeroBoleta: boleta,
          fecha,
          pacienteNombre: this.cleanName(pacienteName),
          celular,
          procedenciaNombre: procedencia,
          medicoNombre: medicoName || 'Médico General',
          grado,
          especialidad,
          descripcionAdicional: tipoEco,
          montoPaciente,
          montoMedico,
          montoClinica,
          montoTecnico: 0,
          nombreTecnico: null,
          estado: 'ACTIVO',
        });
      }
    }

    // --- 3. PARSEAR HOJA: RAYOS X ---
    if (rayosxSheet) {
      const sheet = workbook.Sheets[rayosxSheet];
      const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
      for (let i = 4; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;
        const ticketNum = row[1];
        const pacienteName = row[3];
        if (
          !ticketNum ||
          !pacienteName ||
          String(pacienteName).toUpperCase() === 'TOTAL'
        )
          continue;

        const fechaRaw = row[0];
        const fecha = this.parseDate(fechaRaw);
        const boleta = row[2] ? String(row[2]).trim() : null;
        const encargadoToma = row[4] ? String(row[4]).trim() : 'Samuel';
        const doctorSolicitante = this.cleanDoctorName(String(row[5] || ''));
        const tipoRx = row[7] ? String(row[7]).trim() : 'Radiografía';

        const montoPaciente = Number(row[9] || 0);
        const comisionMedico = Number(row[10] || 0);
        const comisionClinica = Number(row[11] || 0);
        const comisionSamuel = Number(row[12] || 0);

        if (pacienteName === 'ANULADO') {
          ticketsAImportar.push({
            numeroTicket: String(ticketNum),
            numeroBoleta: boleta,
            fecha,
            pacienteNombre: 'ANULADO',
            celular: null,
            procedenciaNombre: 'Ciudad de Dios',
            medicoNombre: 'Dr. Carlos Ramírez',
            grado: 'Doctor',
            especialidad: 'Radiología',
            descripcionAdicional: 'Radiografía Anulada',
            montoPaciente: 0,
            montoMedico: 0,
            montoClinica: 0,
            montoTecnico: 0,
            nombreTecnico: null,
            estado: 'ANULADO',
          });
          continue;
        }

        if (
          doctorSolicitante &&
          !medicosMap.has(doctorSolicitante.toUpperCase())
        ) {
          nuevosMedicos.add(doctorSolicitante);
        }

        const tarifaKey = `RAYOS X|RADIOLOGÍA`;
        if (!tarifasMap.has(tarifaKey)) {
          nuevasTarifas.add(tarifaKey);
        }

        ticketsAImportar.push({
          numeroTicket: String(ticketNum),
          numeroBoleta: boleta,
          fecha,
          pacienteNombre: this.cleanName(pacienteName),
          celular: null,
          procedenciaNombre: 'Ciudad de Dios',
          medicoNombre: 'Dr. Carlos Ramírez', // Radiólogo principal de la clínica
          doctorSolicitanteNombre: doctorSolicitante || null,
          grado: 'Doctor',
          especialidad: 'Radiología',
          descripcionAdicional: tipoRx,
          montoPaciente,
          montoMedico: comisionMedico,
          montoClinica: comisionClinica,
          montoTecnico: comisionSamuel,
          nombreTecnico: encargadoToma,
          estado: 'ACTIVO',
        });
      }
    }

    // --- 4. PARSEAR HOJA: CERTIFICADOS ---
    if (certificadosSheet) {
      const sheet = workbook.Sheets[certificadosSheet];
      const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
      for (let i = 4; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;
        const ticketNum = row[2];
        const pacienteName = row[6];
        if (
          !ticketNum ||
          !pacienteName ||
          String(pacienteName).toUpperCase() === 'TOTAL'
        )
          continue;

        const fechaRaw = row[1];
        const fecha = this.parseDate(fechaRaw);
        const boleta = row[3] ? String(row[3]).trim() : null;
        const certificadoFormulario = row[4]
          ? String(row[4]).trim()
          : 'Certificado Médico';
        const certificadoNumero = row[5] ? String(row[5]).trim() : '';
        const total = Number(row[8] || 0);

        if (pacienteName === 'ANULADO') {
          ticketsAImportar.push({
            numeroTicket: String(ticketNum),
            numeroBoleta: boleta,
            fecha,
            pacienteNombre: 'ANULADO',
            celular: null,
            procedenciaNombre: 'Ciudad de Dios',
            medicoNombre: 'Dr. José Pérez',
            grado: 'Doctor',
            especialidad: 'Certificados',
            descripcionAdicional: 'Certificado Anulado',
            montoPaciente: 0,
            montoMedico: 0,
            montoClinica: 0,
            montoTecnico: 0,
            nombreTecnico: null,
            estado: 'ANULADO',
          });
          continue;
        }

        const tarifaKey = `CERTIFICADO|MEDICINA GENERAL`;
        if (!tarifasMap.has(tarifaKey)) {
          nuevasTarifas.add(tarifaKey);
        }

        ticketsAImportar.push({
          numeroTicket: String(ticketNum),
          numeroBoleta: boleta,
          fecha,
          pacienteNombre: this.cleanName(pacienteName),
          celular: null,
          procedenciaNombre: 'Ciudad de Dios',
          medicoNombre: 'Dr. José Pérez',
          grado: 'Doctor',
          especialidad: 'Medicina General',
          descripcionAdicional: 'Certificado Médico',
          certificadoFormulario,
          certificadoNumero,
          montoPaciente: total,
          montoMedico: 0,
          montoClinica: total,
          montoTecnico: 0,
          nombreTecnico: null,
          estado: 'ACTIVO',
        });
      }
    }

    // --- 5. PARSEAR HOJA: SERVICIOS ---
    if (serviciosSheet) {
      const sheet = workbook.Sheets[serviciosSheet];
      const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
      for (let i = 4; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;
        const ticketNum = row[1];
        const pacienteName = row[3];
        if (
          !ticketNum ||
          !pacienteName ||
          String(pacienteName).toUpperCase() === 'TOTAL'
        )
          continue;

        const fechaRaw = row[0];
        const fecha = this.parseDate(fechaRaw);
        const boleta = row[2] ? String(row[2]).trim() : null;
        const grado = row[4] ? String(row[4]).trim() : 'Doctor';
        const medicoName = this.cleanDoctorName(String(row[5] || ''));
        const especialidad = this.standardizeSpecialty(
          row[6] ? String(row[6]) : 'Cirugía',
        );
        const tipoCirugia = row[7] ? String(row[7]).trim() : '';
        const hc = row[8] ? String(row[8]).trim() : null;
        const obs = row[9] ? String(row[9]).trim() : '';

        const montoPaciente = Number(row[10] || 0);
        const montoMedico = Number(row[11] || 0);
        const montoClinica = Number(row[12] || 0);

        if (pacienteName === 'ANULADO') {
          ticketsAImportar.push({
            numeroTicket: String(ticketNum),
            numeroBoleta: boleta,
            fecha,
            pacienteNombre: 'ANULADO',
            celular: null,
            procedenciaNombre: 'Ciudad de Dios',
            medicoNombre: 'Médico General',
            grado: 'Doctor',
            especialidad: 'SOP',
            descripcionAdicional: 'Servicio Anulado',
            montoPaciente: 0,
            montoMedico: 0,
            montoClinica: 0,
            montoTecnico: 0,
            nombreTecnico: null,
            estado: 'ANULADO',
          });
          continue;
        }

        if (medicoName && !medicosMap.has(medicoName.toUpperCase())) {
          nuevosMedicos.add(medicoName);
        }

        const tarifaKey = `SERVICIOS|${especialidad.toUpperCase()}`;
        if (!tarifasMap.has(tarifaKey)) {
          nuevasTarifas.add(tarifaKey);
        }

        ticketsAImportar.push({
          numeroTicket: String(ticketNum),
          numeroBoleta: boleta,
          fecha,
          pacienteNombre: this.cleanName(pacienteName),
          celular: null,
          procedenciaNombre: 'Ciudad de Dios',
          medicoNombre: medicoName || 'Médico General',
          grado,
          especialidad,
          descripcionAdicional: `${tipoCirugia} ${obs}`.trim(),
          historiaClinica: hc,
          montoPaciente,
          montoMedico,
          montoClinica,
          montoTecnico: 0,
          nombreTecnico: null,
          estado: 'ACTIVO',
        });
      }
    }

    // --- 6. PARSEAR HOJA: HISTORIAS CLINICAS FEDATEADAS ---
    const historiaSheet = findSheet(['HISTORIAS FEDATEADAS']);
    if (historiaSheet) {
      const sheet = workbook.Sheets[historiaSheet];
      const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
      for (let i = 5; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;
        const ticketNum = row[1];
        const personaSolicita = row[2];
        if (
          !ticketNum ||
          !personaSolicita ||
          String(personaSolicita).toUpperCase() === 'TOTAL'
        )
          continue;

        const fechaRaw = row[0];
        const fecha = this.parseDate(fechaRaw);
        const pacienteName = row[3] ? String(row[3]).trim() : 'Paciente';
        const medicoName = this.cleanDoctorName(String(row[4] || ''));
        const especialidad = this.standardizeSpecialty(
          row[5] ? String(row[5]) : 'Medicina General',
        );
        const desc = row[7] ? String(row[7]).trim() : 'Historia Clínica';
        const total = Number(row[8] || 0);

        if (medicoName && !medicosMap.has(medicoName.toUpperCase())) {
          nuevosMedicos.add(medicoName);
        }

        ticketsAImportar.push({
          numeroTicket: String(ticketNum),
          numeroBoleta: null,
          fecha,
          pacienteNombre: this.cleanName(pacienteName),
          celular: null,
          procedenciaNombre: 'Ciudad de Dios',
          medicoNombre: medicoName || 'Dr. José Pérez',
          grado: 'Doctor',
          especialidad,
          descripcionAdicional: desc,
          solicitanteHistoriaClinica: String(personaSolicita),
          montoPaciente: total,
          montoMedico: 0,
          montoClinica: total,
          montoTecnico: 0,
          nombreTecnico: null,
          estado: 'ACTIVO',
        });
      }
    }

    // --- 7. PARSEAR HOJA: EGRESOS (GASTOS GENERALES) ---
    if (egresosSheet) {
      const sheet = workbook.Sheets[egresosSheet];
      const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
      for (let i = 4; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;
        const fechaRaw = row[0];
        const total = Number(row[5] || 0);
        if (!fechaRaw || total === 0 || isNaN(total)) continue;

        const fecha = this.parseDate(fechaRaw);
        const comprobante = row[1] ? String(row[1]).trim() : null;
        const proveedor = row[2] ? String(row[2]).trim() : 'Varios';
        const ruc = row[3] ? String(row[3]).trim() : null;
        const obs = row[4] ? String(row[4]).trim() : 'Egreso';

        egresosAImportar.push({
          fecha,
          tipoEgreso: 'GASTO',
          numeroComprobante: comprobante,
          proveedor,
          ruc,
          observaciones: obs,
          monto: total,
        });
      }
    }

    // --- 8. PARSEAR HOJA: PAGOS FIJOS ---
    const pagosFijosSheet = findSheet(['PAGOS FIJOS']);
    if (pagosFijosSheet) {
      const sheet = workbook.Sheets[pagosFijosSheet];
      const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
      for (let i = 3; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;
        const fechaRaw = row[0];
        const total = Number(row[3] || 0);
        if (!fechaRaw || total === 0 || isNaN(total)) continue;

        const fecha = this.parseDate(fechaRaw);
        const operacion = row[1] ? String(row[1]).trim() : null;
        const detalle = row[2] ? String(row[2]).trim() : 'Pago Fijo Local';

        egresosAImportar.push({
          fecha,
          tipoEgreso: 'PAGO_FIJO',
          numeroComprobante: operacion,
          proveedor: 'Servicio local / Hidrandina / Sedalib',
          ruc: null,
          observaciones: detalle,
          monto: total,
        });
      }
    }

    // --- 9. PARSEAR HOJA: SUELDOS DEL PERSONAL ---
    const sueldosSheet = findSheet(['SUELDOS']);
    if (sueldosSheet) {
      const sheet = workbook.Sheets[sueldosSheet];
      const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
      for (let i = 4; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;
        const fechaRaw = row[0];
        const total = Number(row[4] || 0);
        if (!fechaRaw || total === 0 || isNaN(total)) continue;

        const fecha = this.parseDate(fechaRaw);
        const cargo = row[1] ? String(row[1]).trim() : 'Personal';
        const nombre = row[2] ? String(row[2]).trim() : '';
        const obs = row[3] ? String(row[3]).trim() : 'Sueldo';

        egresosAImportar.push({
          fecha,
          tipoEgreso: 'PLANILLA',
          numeroComprobante: null,
          proveedor: nombre,
          ruc: null,
          observaciones: `${cargo} - ${obs}`,
          monto: total,
        });
      }
    }

    // --- 10. PARSEAR HOJA: DIETAS ---
    if (dietasSheet) {
      const sheet = workbook.Sheets[dietasSheet];
      const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
      for (let i = 6; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;
        const fechaRaw = row[0];
        const total = Number(row[4] || 0);
        if (!fechaRaw || total === 0 || isNaN(total)) continue;

        const fecha = this.parseDate(fechaRaw);
        // Si hay dietas, las registramos
        dietasAImportar.push({
          fecha,
          desayunoCant: Number(row[1] || 0),
          almuerzoCant: Number(row[2] || 0),
          cenaCant: Number(row[3] || 0),
          observaciones: row[5] ? String(row[5]).trim() : null,
          monto: total,
        });
      }
    }

    // Calcular mes identificado
    const uniqueDates = Array.from(
      new Set([
        ...ticketsAImportar.map((t) => t.fecha.substring(0, 10)),
        ...egresosAImportar.map((e) => e.fecha.substring(0, 10)),
      ]),
    ).filter(Boolean);

    let mesIdentificado = 'Histórico';
    if (uniqueDates.length > 0) {
      const sampleDate = new Date(uniqueDates[0]);
      const meses = [
        'ENERO',
        'FEBRERO',
        'MARZO',
        'ABRIL',
        'MAYO',
        'JUNIO',
        'JULIO',
        'AGOSTO',
        'SEPTIEMBRE',
        'OCTUBRE',
        'NOVIEMBRE',
        'DICIEMBRE',
      ];
      mesIdentificado = `${meses[sampleDate.getMonth()]} ${sampleDate.getFullYear()}`;
    }

    // Sumatorias de control
    const totalCobrado = ticketsAImportar.reduce(
      (sum, t) => sum + (t.estado === 'ACTIVO' ? t.montoPaciente : 0),
      0,
    );
    const totalTickets = ticketsAImportar.length;
    const totalEgresosVal = egresosAImportar.reduce(
      (sum, e) => sum + e.monto,
      0,
    );

    const summary = {
      mesIdentificado,
      totalCobrado,
      totalTickets,
      totalEgresos: egresosAImportar.length,
      totalEgresosMonto: totalEgresosVal,
      medicosNuevos: Array.from(nuevosMedicos),
      procedenciasNuevas: Array.from(nuevasProcedencias),
      alertas: [
        `${ticketsAImportar.filter((t) => !t.celular).length} atenciones sin número de celular.`,
        `${nuevasTarifas.size} tarifas que se crearán dinámicamente.`,
      ],
    };

    if (dryRun) {
      return { success: true, summary };
    }

    // --- MODO INSERCIÓN REAL: TRANSACCIÓN DE BASE DE DATOS ---
    await this.prisma.$transaction(
      async (tx) => {
        // Lookup seeded admin user to use as fallback for importer-created records
        const adminUser = await tx.usuario.findUnique({
          where: { usuario: 'admin' },
        });
        // Cargar todos los pacientes en memoria
        const dbPacientes = await tx.paciente.findMany();
        const pacientesMap = new Map<string, any>();
        dbPacientes.forEach((p) => pacientesMap.set(p.nombre.toUpperCase(), p));

        // Cargar todos los tickets existentes para evitar duplicaciones y hacer inserts directos
        const dbTicketNums = await tx.ticket.findMany({
          select: { numeroTicket: true },
        });
        const existingTicketNums = new Set(
          dbTicketNums.map((t) => t.numeroTicket),
        );

        // Cargar egresos existentes en memoria: clave = fecha+monto+observaciones
        const dbEgresos = await tx.egreso.findMany({
          select: {
            fecha: true,
            monto: true,
            observaciones: true,
            cajaDiariaId: true,
          },
        });
        const existingEgresoKeys = new Set(
          dbEgresos.map(
            (e) =>
              `${e.fecha.toISOString().substring(0, 10)}|${Number(e.monto).toFixed(2)}|${(e.observaciones || '').trim().toUpperCase()}`,
          ),
        );

        // Cargar dietas existentes en memoria: clave = cajaDiariaId
        const dbDietas = await tx.dieta.findMany({
          select: { cajaDiariaId: true },
        });
        const existingDietaCajaIds = new Set(
          dbDietas.map((d) => d.cajaDiariaId),
        );

        // 1. Crear procedencias nuevas
        for (const proc of nuevasProcedencias) {
          const existing = await tx.procedencia.findUnique({
            where: { nombre: proc },
          });
          if (!existing) {
            const p = await tx.procedencia.create({
              data: { nombre: proc },
            });
            procedenciasMap.set(proc.toUpperCase(), p);
          }
        }

        // 2. Crear médicos nuevos
        for (const med of nuevosMedicos) {
          const existing = await tx.medico.findUnique({
            where: { nombre: med },
          });
          if (!existing) {
            const m = await tx.medico.create({
              data: {
                nombre: med,
                especialidad: 'Medicina General',
                grado: 'Doctor',
              },
            });
            medicosMap.set(med.toUpperCase(), m);
          }
        }

        // 3. Registrar al médico de Rayos X default
        let radMedico = await tx.medico.findUnique({
          where: { nombre: 'Dr. Carlos Ramírez' },
        });
        if (!radMedico) {
          radMedico = await tx.medico.create({
            data: {
              nombre: 'Dr. Carlos Ramírez',
              especialidad: 'Radiología',
              grado: 'Doctor',
            },
          });
        }
        medicosMap.set('DR. CARLOS RAMÍREZ', radMedico);
        medicosMap.set('CARLOS RAMÍREZ', radMedico);

        // 4. Crear tarifas nuevas detectadas
        for (const tfKey of nuevasTarifas) {
          const [cat, esp] = tfKey.split('|');
          const existing = await tx.tarifa.findFirst({
            where: {
              categoria: cat,
              especialidad: esp,
            },
          });
          if (!existing) {
            const t = await tx.tarifa.create({
              data: {
                categoria: cat,
                especialidad: esp,
                descripcion: `${cat} de ${esp}`,
                precioTotal: 100,
                tipoReparto: 'PORCENTAJE',
                comisionMedico: 50,
                comisionClinica: 50,
              },
            });
            tarifasMap.set(tfKey, t);
          }
        }

        // 5. Crear cajas diarias cerradas para cada fecha del Excel
        const cajasMap = new Map<string, any>();
        for (const dateStr of uniqueDates) {
          const dateObj = new Date(dateStr);
          let existingCaja = await tx.cajaDiaria.findFirst({
            where: {
              fecha: dateObj,
            },
          });
          if (!existingCaja) {
            existingCaja = await tx.cajaDiaria.create({
              data: {
                fecha: dateObj,
                montoApertura: 0,
                montoEfectivoEsperado: 0,
                montoDigitalEsperado: 0,
                abierta: false,
                fechaApertura: dateObj,
                fechaCierre: dateObj,
                usuarioAperturaId: adminUser?.id,
                usuarioCierreId: adminUser?.id,
              },
            });
          }
          cajasMap.set(dateStr, existingCaja);
        }

        // 6. Insertar tickets
        for (const tk of ticketsAImportar) {
          const dateStr = tk.fecha.substring(0, 10);
          const caja = cajasMap.get(dateStr);

          // Crear procedencia si no existe
          const procKey = tk.procedenciaNombre.toUpperCase();
          let proc = procedenciasMap.get(procKey);
          if (!proc) {
            proc = await tx.procedencia.create({
              data: { nombre: tk.procedenciaNombre },
            });
            procedenciasMap.set(procKey, proc);
          }

          // Crear/Buscar Paciente en mapa
          const pacKey = tk.pacienteNombre.toUpperCase();
          let paciente = pacientesMap.get(pacKey);
          if (!paciente) {
            paciente = await tx.paciente.create({
              data: {
                nombre: tk.pacienteNombre,
                celular: tk.celular,
                procedenciaId: proc.id,
                numeroHistoriaClinica: tk.historiaClinica || null,
              },
            });
            pacientesMap.set(pacKey, paciente);
          }

          // Médico
          const medKey = tk.medicoNombre.toUpperCase();
          let medico = medicosMap.get(medKey);
          if (!medico) {
            medico = await tx.medico.create({
              data: {
                nombre: tk.medicoNombre,
                especialidad: tk.especialidad,
                grado: tk.grado,
              },
            });
            medicosMap.set(medKey, medico);
          }

          // Doctor solicitante (para Rayos X)
          let medicoSolicitanteId: number | null = null;
          if (tk.doctorSolicitanteNombre) {
            const reqKey = tk.doctorSolicitanteNombre.toUpperCase();
            let reqMed = medicosMap.get(reqKey);
            if (!reqMed) {
              reqMed = await tx.medico.create({
                data: {
                  nombre: tk.doctorSolicitanteNombre,
                  especialidad: 'Radiología',
                  grado: 'Doctor',
                },
              });
              medicosMap.set(reqKey, reqMed);
            }
            medicoSolicitanteId = reqMed.id;
          }

          // Tarifa
          let cat = 'Consulta';
          const espUpper = tk.especialidad.toUpperCase();
          if (espUpper.includes('ECOGRAF')) cat = 'Ecografía';
          else if (espUpper.includes('RADIOL') || espUpper.includes('RAYOS'))
            cat = 'Rayos X';
          else if (espUpper.includes('CERTIF')) cat = 'Certificado';
          else if (espUpper.includes('HISTOR')) cat = 'Historia Clínica';
          else if (espUpper.includes('SOP') || espUpper.includes('CIRUG'))
            cat = 'SOP';

          cat = standardizeCategory(cat);
          const stdEsp = standardizeSpecialty(tk.especialidad);

          const tfKey = `${cat.toUpperCase()}|${stdEsp.toUpperCase()}`;
          let tarifa = tarifasMap.get(tfKey);
          if (!tarifa) {
            tarifa = await tx.tarifa.create({
              data: {
                categoria: cat,
                especialidad: stdEsp,
                descripcion: `${cat} de ${stdEsp}`,
                precioTotal: tk.montoPaciente,
                tipoReparto: 'PORCENTAJE',
                comisionMedico: tk.montoMedico,
                comisionClinica: tk.montoClinica,
              },
            });
            tarifasMap.set(tfKey, tarifa);
          }

          // Crear ticket directo (si no existe ya)
          if (!existingTicketNums.has(tk.numeroTicket)) {
            await tx.ticket.create({
              data: {
                numeroTicket: tk.numeroTicket,
                numeroBoleta: tk.numeroBoleta,
                fecha: new Date(tk.fecha),
                pacienteId: paciente.id,
                medicoId: medico.id,
                medicoSolicitanteId,
                tarifaId: tarifa.id,
                descripcionAdicional: tk.descripcionAdicional,
                metodoPago: 'EFECTIVO',
                montoPaciente: tk.montoPaciente,
                montoMedico: tk.montoMedico,
                montoClinica: tk.montoClinica,
                montoTecnico: tk.montoTecnico,
                nombreTecnico: tk.nombreTecnico,
                estado: tk.estado,
                cajaDiariaId: caja.id,
                usuarioCreadorId: adminUser?.id,
                solicitanteHistoriaClinica:
                  tk.solicitanteHistoriaClinica || null,
                certificadoFormulario: tk.certificadoFormulario || null,
                certificadoNumero: tk.certificadoNumero || null,
              },
            });
            existingTicketNums.add(tk.numeroTicket);
          }
        }

        // 7. Insertar egresos (con deduplicación por fecha+monto+observaciones)
        for (const eg of egresosAImportar) {
          const dateStr = eg.fecha.substring(0, 10);
          const caja = cajasMap.get(dateStr);
          const egresoKey = `${dateStr}|${Number(eg.monto).toFixed(2)}|${(eg.observaciones || '').trim().toUpperCase()}`;

          if (!existingEgresoKeys.has(egresoKey)) {
            await tx.egreso.create({
              data: {
                fecha: new Date(eg.fecha),
                tipoEgreso: eg.tipoEgreso,
                numeroComprobante: eg.numeroComprobante,
                proveedor: eg.proveedor,
                ruc: eg.ruc,
                observaciones: eg.observaciones,
                monto: eg.monto,
                cajaDiariaId: caja.id,
                usuarioEgresoId: adminUser?.id,
              },
            });
            existingEgresoKeys.add(egresoKey);
          }
        }

        // 8. Insertar dietas (con deduplicación por cajaDiariaId)
        for (const dt of dietasAImportar) {
          const dateStr = dt.fecha.substring(0, 10);
          const caja = cajasMap.get(dateStr);

          if (!existingDietaCajaIds.has(caja.id)) {
            await tx.dieta.create({
              data: {
                fecha: new Date(dt.fecha),
                desayunoCant: dt.desayunoCant,
                almuerzoCant: dt.almuerzoCant,
                cenaCant: dt.cenaCant,
                observaciones: dt.observaciones,
                monto: dt.monto,
                cajaDiariaId: caja.id,
              },
            });
            existingDietaCajaIds.add(caja.id);
          }
        }

        // 9. Actualizar saldos finales esperados de cada caja creada
        for (const [dateStr, caja] of cajasMap.entries()) {
          const ticketsDeCaja = ticketsAImportar.filter(
            (t) =>
              t.fecha.substring(0, 10) === dateStr && t.estado === 'ACTIVO',
          );
          const egresosDeCaja = egresosAImportar.filter(
            (e) => e.fecha.substring(0, 10) === dateStr,
          );

          const totalIngresos = ticketsDeCaja.reduce(
            (sum, t) => sum + t.montoPaciente,
            0,
          );
          const totalEgresos = egresosDeCaja.reduce(
            (sum, e) => sum + e.monto,
            0,
          );
          const efectivoEsperado = totalIngresos - totalEgresos;

          await tx.cajaDiaria.update({
            where: { id: caja.id },
            data: {
              montoEfectivoEsperado: efectivoEsperado,
              montoEfectivoReal: efectivoEsperado,
            },
          });
        }
      },
      {
        timeout: 60000,
      },
    );

    return { success: true, summary };
  }

  private parseDate(val: any): string {
    if (!val) return new Date().toISOString();
    if (val instanceof Date) {
      return val.toISOString();
    }
    // Si es un número (formato fecha de excel)
    if (typeof val === 'number') {
      const date = new Date((val - 25569) * 86400 * 1000);
      return date.toISOString();
    }
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
    return new Date().toISOString();
  }
}
