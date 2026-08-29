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

    const medico = await this.prisma.medico.findUnique({
      where: { id: createComprobantePagoMedicoDto.medicoId },
    });

    if (!medico) {
      throw new NotFoundException('Médico no encontrado');
    }

    const caja = await this.prisma.cajaDiaria.findFirst({
      where: { abierta: true },
      orderBy: { fecha: 'desc' },
    });

    if (!caja) {
      throw new NotFoundException('No hay caja diaria abierta');
    }

    // 1. Verificar si ya existe un comprobante en BORRADOR para este médico
    const borradorExistente =
      await this.prisma.comprobantePagoMedico.findFirst({
        where: {
          medicoId: createComprobantePagoMedicoDto.medicoId,
          estado: 'BORRADOR',
        },
        orderBy: { fecha: 'desc' },
      });

    // 2. Buscar tickets pendientes de liquidación (comprobantePagoMedicoId === null)
    const ticketsNuevos = await this.prisma.ticket.findMany({
      where: {
        medicoId: createComprobantePagoMedicoDto.medicoId,
        fecha: {
          gte: new Date(createComprobantePagoMedicoDto.periodoInicio),
          lte: new Date(createComprobantePagoMedicoDto.periodoFin),
        },
        estado: 'ACTIVO',
        comprobantePagoMedicoId: null,
      },
      include: {
        tarifa: true,
      },
    });

    // Caso A: Ya existe borrador
    if (borradorExistente) {
      if (ticketsNuevos.length > 0) {
        // Anexar los nuevos tickets al borrador existente
        await this.prisma.ticket.updateMany({
          where: { id: { in: ticketsNuevos.map((t) => t.id) } },
          data: { comprobantePagoMedicoId: borradorExistente.id },
        });

        // Recalcular montos del borrador existente
        const todosTickets = await this.prisma.ticket.findMany({
          where: {
            comprobantePagoMedicoId: borradorExistente.id,
            estado: 'ACTIVO',
          },
        });

        const totalCalculado = todosTickets.reduce(
          (acc, t) => acc + Number(t.montoMedico),
          0,
        );
        const descuento = Number(borradorExistente.montoDescuento || 0);

        await this.prisma.comprobantePagoMedico.update({
          where: { id: borradorExistente.id },
          data: {
            montoTotal: new Decimal(totalCalculado),
            montoNeto: new Decimal(totalCalculado - descuento),
            cantidadServicios: todosTickets.length,
          },
        });
      }
      return this.findOne(borradorExistente.id);
    }

    // Caso B: No existe borrador y tampoco hay tickets pendientes
    if (ticketsNuevos.length === 0) {
      throw new BadRequestException(
        'No hay atenciones o servicios pendientes de pago para este médico hoy.',
      );
    }

    // Caso C: No existe borrador y SI hay tickets pendientes -> Crear nuevo comprobante
    const ultimoComprobante =
      await this.prisma.comprobantePagoMedico.findFirst({
        where: { medicoId: createComprobantePagoMedicoDto.medicoId },
        orderBy: { correlativoMedico: 'desc' },
      });
    const correlativoMedico = (ultimoComprobante?.correlativoMedico || 0) + 1;

    const montoTotalCalculado = ticketsNuevos.reduce(
      (acc, t) => acc + Number(t.montoMedico),
      0,
    );

    const montoDescuento = createComprobantePagoMedicoDto.montoDescuento || 0;
    const montoNeto = montoTotalCalculado - montoDescuento;

    const comprobante = await this.prisma.comprobantePagoMedico.create({
      data: {
        medicoId: createComprobantePagoMedicoDto.medicoId,
        correlativoMedico,
        periodoInicio: new Date(createComprobantePagoMedicoDto.periodoInicio),
        periodoFin: new Date(createComprobantePagoMedicoDto.periodoFin),
        montoTotal: new Decimal(montoTotalCalculado),
        montoDescuento: new Decimal(montoDescuento),
        montoNeto: new Decimal(montoNeto),
        cantidadServicios: ticketsNuevos.length,
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

    // Vincular los tickets con el nuevo comprobante
    await this.prisma.ticket.updateMany({
      where: { id: { in: ticketsNuevos.map((t) => t.id) } },
      data: { comprobantePagoMedicoId: comprobante.id },
    });

    return this.findOne(comprobante.id);
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

    let tickets = await this.prisma.ticket.findMany({
      where: { comprobantePagoMedicoId: comprobante.id },
      include: { tarifa: true, paciente: true },
    });

    if (tickets.length === 0) {
      tickets = await this.prisma.ticket.findMany({
        where: {
          medicoId: comprobante.medicoId,
          fecha: {
            gte: comprobante.periodoInicio,
            lte: comprobante.periodoFin,
          },
          estado: 'ACTIVO',
        },
        include: { tarifa: true, paciente: true },
      });
    }

    return {
      ...comprobante,
      tickets: tickets.map((t) => ({
        id: t.id,
        numeroTicket: t.numeroTicket,
        paciente: t.paciente?.nombre || t.descripcionAdicional || 'Paciente',
        tarifa: t.tarifa?.descripcion || 'Servicio',
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
      orderBy: { correlativoMedico: 'desc' },
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
      orderBy: { correlativoMedico: 'desc' },
    });
  }

  async firmarComprobante(
    id: number,
    firmarComprobantePagoDto: FirmarComprobantePagoDto,
  ) {
    const comprobante = await this.findOne(id);

    if (comprobante.estado === 'FIRMADO') {
      throw new BadRequestException('El comprobante ya ha sido firmado');
    }

    let tickets = await this.prisma.ticket.findMany({
      where: { comprobantePagoMedicoId: comprobante.id },
      include: { tarifa: true, paciente: true },
    });

    if (tickets.length === 0) {
      tickets = await this.prisma.ticket.findMany({
        where: {
          medicoId: comprobante.medicoId,
          fecha: {
            gte: comprobante.periodoInicio,
            lte: comprobante.periodoFin,
          },
          estado: 'ACTIVO',
        },
        include: { tarifa: true, paciente: true },
      });
    }

    const pdfPath = await this.pdfGeneratorService.generarComprobantePDF({
      numeroComprobante: comprobante.correlativoMedico || comprobante.id,
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
        paciente: t.paciente?.nombre || t.descripcionAdicional || 'Paciente',
        tarifa: t.tarifa?.descripcion || 'Servicio',
        monto: Number(t.montoPaciente),
        comisionMedico: Number(t.montoMedico),
      })),
    });

    const pdfFilename = pdfPath.includes('\\')
      ? pdfPath.split('\\').pop()
      : pdfPath.split('/').pop();

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
      throw new BadRequestException('El comprobante ya ha sido cancelado');
    }

    // Liberar los tickets vinculados a este comprobante
    await this.prisma.ticket.updateMany({
      where: { comprobantePagoMedicoId: id },
      data: { comprobantePagoMedicoId: null },
    });

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
      0,
      0,
      0,
    );
    const finHoy = new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      hoy.getDate(),
      23,
      59,
      59,
    );

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
