import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateComprobantePagoMedicoDto,
  FirmarComprobantePagoDto,
} from './dto/create-comprobante-pago.dto';
import { Decimal } from '@prisma/client/runtime/library';
import { PdfGeneratorService } from '../pdf-generator/pdf-generator.service';

@Injectable()
export class ComprobantePagoMedicoService {
  constructor(
    private prisma: PrismaService,
    private pdfGeneratorService: PdfGeneratorService,
  ) {}

  async generarComprobante(
    createComprobantePagoMedicoDto: CreateComprobantePagoMedicoDto,
    usuarioCreadorId?: number,
  ) {
    let creadorId = usuarioCreadorId;
    if (!creadorId) {
      const admin = await this.prisma.usuario.findFirst({
        orderBy: { id: 'asc' },
      });
      creadorId = admin?.id || 1;
    }
    // Validar que exista el médico
    const medico = await this.prisma.medico.findUnique({
      where: { id: createComprobantePagoMedicoDto.medicoId },
    });

    if (!medico) {
      throw new NotFoundException('Médico no encontrado');
    }

    // Obtener caja abierta
    const caja = await this.prisma.cajaDiaria.findFirst({
      where: { abierta: true },
      orderBy: { fecha: 'desc' },
    });

    if (!caja) {
      throw new NotFoundException('No hay caja diaria abierta');
    }

    // Obtener servicios del médico en el período
    const tickets = await this.prisma.ticket.findMany({
      where: {
        medicoId: createComprobantePagoMedicoDto.medicoId,
        fecha: {
          gte: new Date(createComprobantePagoMedicoDto.periodoInicio),
          lte: new Date(createComprobantePagoMedicoDto.periodoFin),
        },
        estado: 'ACTIVO',
      },
      include: {
        tarifa: true,
      },
    });

    // Calcular montoTotal seguro basado en los tickets obtenidos de la BD
    const montoTotalCalculado = tickets.reduce(
      (acc, t) => acc + Number(t.montoMedico),
      0,
    );

    // Crear comprobante
    const montoDescuento = createComprobantePagoMedicoDto.montoDescuento || 0;
    const montoNeto = montoTotalCalculado - montoDescuento;

    const comprobante = await this.prisma.comprobantePagoMedico.create({
      data: {
        medicoId: createComprobantePagoMedicoDto.medicoId,
        periodoInicio: new Date(createComprobantePagoMedicoDto.periodoInicio),
        periodoFin: new Date(createComprobantePagoMedicoDto.periodoFin),
        montoTotal: new Decimal(montoTotalCalculado),
        montoDescuento: new Decimal(montoDescuento),
        montoNeto: new Decimal(montoNeto),
        cantidadServicios: tickets.length,
        estado: 'BORRADOR',
        cajaDiariaId: caja.id,
        usuarioCreadorId: creadorId,
        observaciones: createComprobantePagoMedicoDto.observaciones,
      },
      include: {
        medico: true,
        cajaDiaria: true,
        usuarioCreador: { select: { id: true, nombre: true } },
      },
    });

    return {
      ...comprobante,
      tickets: tickets.map((t) => ({
        id: t.id,
        numeroTicket: t.numeroTicket,
        paciente: t.descripcionAdicional,
        tarifa: t.tarifa.descripcion,
        monto: Number(t.montoPaciente),
        comisionMedico: Number(t.montoMedico),
      })),
    };
  }

  async findOne(id: number) {
    const comprobante = await this.prisma.comprobantePagoMedico.findUnique({
      where: { id },
      include: {
        medico: true,
        cajaDiaria: true,
        usuarioCreador: { select: { id: true, nombre: true } },
      },
    });

    if (!comprobante) {
      throw new NotFoundException('Comprobante no encontrado');
    }

    // Obtener tickets asociados
    const tickets = await this.prisma.ticket.findMany({
      where: {
        medicoId: comprobante.medicoId,
        fecha: {
          gte: comprobante.periodoInicio,
          lte: comprobante.periodoFin,
        },
        estado: 'ACTIVO',
      },
      include: {
        tarifa: true,
        paciente: true,
      },
    });

    return {
      ...comprobante,
      tickets: tickets.map((t) => ({
        id: t.id,
        numeroTicket: t.numeroTicket,
        paciente: t.paciente.nombre,
        tarifa: t.tarifa.descripcion,
        monto: Number(t.montoPaciente),
        comisionMedico: Number(t.montoMedico),
      })),
    };
  }

  async findByMedicoYPeriodo(
    medicoId: number,
    periodoInicio: Date,
    periodoFin: Date,
  ) {
    return this.prisma.comprobantePagoMedico.findFirst({
      where: {
        medicoId,
        periodoInicio,
        periodoFin,
      },
      include: {
        medico: true,
        usuarioCreador: { select: { id: true, nombre: true } },
      },
    });
  }

  async findAllByMedico(medicoId: number) {
    return this.prisma.comprobantePagoMedico.findMany({
      where: { medicoId },
      include: {
        medico: true,
        usuarioCreador: { select: { id: true, nombre: true } },
      },
      orderBy: { fecha: 'desc' },
    });
  }

  async findAll(filtros?: { estado?: string; medicoId?: number }) {
    return this.prisma.comprobantePagoMedico.findMany({
      where: {
        estado: filtros?.estado ? (filtros.estado as any) : undefined,
        medicoId: filtros?.medicoId,
      },
      include: {
        medico: true,
        usuarioCreador: { select: { id: true, nombre: true } },
      },
      orderBy: { fecha: 'desc' },
    });
  }

  async firmarComprobante(
    id: number,
    firmarComprobantePagoDto: FirmarComprobantePagoDto,
  ) {
    const comprobante = await this.findOne(id);

    if (comprobante.estado === 'FIRMADO') {
      throw new Error('El comprobante ya ha sido firmado');
    }

    // Obtener tickets para incluir en PDF
    const tickets = await this.prisma.ticket.findMany({
      where: {
        medicoId: comprobante.medicoId,
        fecha: {
          gte: comprobante.periodoInicio,
          lte: comprobante.periodoFin,
        },
        estado: 'ACTIVO',
      },
      include: {
        tarifa: true,
        paciente: true,
      },
    });

    // Generar PDF con firma digital
    const pdfPath = await this.pdfGeneratorService.generarComprobantePDF({
      numeroComprobante: id,
      medicoNombre: comprobante.medico.nombre,
      medicoEspecialidad: comprobante.medico.especialidad,
      periodoInicio: comprobante.periodoInicio.toISOString(),
      periodoFin: comprobante.periodoFin.toISOString(),
      montoTotal: Number(comprobante.montoTotal),
      montoDescuento: Number(comprobante.montoDescuento),
      montoNeto: Number(comprobante.montoNeto),
      cantidadServicios: comprobante.cantidadServicios,
      firmaDigital: firmarComprobantePagoDto.firmaDigital,
      fechaGeneracion: new Date().toISOString(),
      clinicaNombre: 'Caja Clínica',
      tickets: tickets.map((t) => ({
        numeroTicket: t.numeroTicket,
        paciente: t.paciente.nombre,
        tarifa: t.tarifa.descripcion,
        monto: Number(t.montoPaciente),
        comisionMedico: Number(t.montoMedico),
      })),
    });

    // Extraer nombre del archivo del path
    const pdfFilename = pdfPath.includes('\\')
      ? pdfPath.split('\\').pop()
      : pdfPath.split('/').pop();

    // Actualizar comprobante con ruta del PDF
    return this.prisma.comprobantePagoMedico.update({
      where: { id },
      data: {
        estado: 'FIRMADO',
        firmaDigital: firmarComprobantePagoDto.firmaDigital,
        documentoPdfPath: pdfFilename,
      },
      include: {
        medico: true,
        usuarioCreador: { select: { id: true, nombre: true } },
      },
    });
  }

  async cancelarComprobante(id: number) {
    const comprobante = await this.findOne(id);

    if (comprobante.estado === 'CANCELADO') {
      throw new Error('El comprobante ya ha sido cancelado');
    }

    return this.prisma.comprobantePagoMedico.update({
      where: { id },
      data: { estado: 'CANCELADO' },
      include: {
        medico: true,
        usuarioCreador: { select: { id: true, nombre: true } },
      },
    });
  }

  async generarComprobanteDia(medicoId: number, usuarioCreadorId?: number) {
    const medico = await this.prisma.medico.findUnique({
      where: { id: medicoId },
    });

    if (!medico) {
      throw new NotFoundException('Médico no encontrado');
    }

    const hoy = new Date();
    const inicioHoy = new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      hoy.getDate(),
    );
    const finHoy = new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      hoy.getDate() + 1,
    );

    // Buscar tickets del médico del día
    const tickets = await this.prisma.ticket.findMany({
      where: {
        medicoId,
        fecha: {
          gte: inicioHoy,
          lt: finHoy,
        },
        estado: 'ACTIVO',
      },
    });

    if (tickets.length === 0) {
      throw new BadRequestException(
        'No hay servicios o atenciones registradas para este médico el día de hoy',
      );
    }

    return this.generarComprobante(
      {
        medicoId,
        periodoInicio: inicioHoy,
        periodoFin: finHoy,
      },
      usuarioCreadorId,
    );
  }
}
