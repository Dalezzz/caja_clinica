import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto, TicketItemDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  calculateTicketTotals(items: TicketItemDto[], montoSolicitante = 0) {
    const normalizedItems = (items || []).filter(Boolean);

    const tarifaId = normalizedItems[0]?.tarifaId ?? null;
    const montoPaciente = normalizedItems.reduce(
      (sum, item) => sum + Number(item.precioUnitario || 0) * Number(item.cantidad || 1),
      0,
    );
    const montoMedico = normalizedItems.reduce(
      (sum, item) => sum + Number(item.comisionMedico || 0) * Number(item.cantidad || 1),
      0,
    );
    const montoTecnico = normalizedItems.reduce(
      (sum, item) => sum + Number(item.comisionTecnico || 0) * Number(item.cantidad || 1),
      0,
    );

    const ajusteSolicitante = Math.min(
      Math.max(0, Number(montoSolicitante || 0)),
      Math.round(montoPaciente * 0.19),
    );

    return {
      tarifaId,
      montoPaciente,
      montoMedico,
      montoTecnico,
      montoClinica: Math.max(0, montoPaciente - montoMedico - montoTecnico - ajusteSolicitante),
    };
  }

  async create(createTicketDto: CreateTicketDto) {
    const caja = await this.prisma.cajaDiaria.findFirst({
      where: { abierta: true },
      orderBy: { fecha: 'desc' },
    });

    if (!caja) {
      throw new NotFoundException('No hay caja diaria abierta');
    }

    const ticketItems = createTicketDto.items && createTicketDto.items.length > 0
      ? createTicketDto.items
      : [{
          tarifaId: createTicketDto.tarifaId as number,
          descripcion: createTicketDto.descripcionAdicional,
          precioUnitario: 0,
          cantidad: 1,
          comisionMedico: 0,
          comisionClinica: 0,
          comisionTecnico: 0,
        }];

    const primaryTarifaId = ticketItems[0]?.tarifaId;
    if (!primaryTarifaId) {
      throw new NotFoundException('Tarifa no encontrada');
    }

    const tarifa = await this.prisma.tarifa.findUnique({
      where: { id: primaryTarifaId },
    });

    if (!tarifa) {
      throw new NotFoundException('Tarifa no encontrada');
    }

    const lastTicket = await this.prisma.ticket.findFirst({
      where: { cajaDiariaId: caja.id },
      orderBy: { id: 'desc' },
    });

    const nextTicketNumber = lastTicket
      ? Number.parseInt(lastTicket.numeroTicket.split('-').pop() || '0', 10) + 1
      : 1;
    const numeroTicket = `${caja.fecha.toISOString().split('T')[0]}-${String(nextTicketNumber).padStart(4, '0')}`;

    const totals = this.calculateTicketTotals(ticketItems, createTicketDto.montoSolicitante ?? 0);
    const montoPaciente = totals.montoPaciente || Number(tarifa.precioTotal || 0);
    const montoMedico = totals.montoMedico || Number(tarifa.comisionMedico || 0);
    const montoClinica = totals.montoClinica || Number(tarifa.comisionClinica || 0);
    const montoTecnico = totals.montoTecnico || (tarifa.requiereTecnico ? Number(tarifa.comisionTecnico || 0) : 0);

    let usuarioCreadorId = (createTicketDto as any).usuarioCreadorId as number | undefined;
    if (!usuarioCreadorId) {
      const admin = await this.prisma.usuario.findFirst({ orderBy: { id: 'asc' } });
      usuarioCreadorId = admin?.id || 1;
    }

    const ticket = await this.prisma.ticket.create({
      data: {
        numeroTicket,
        pacienteId: createTicketDto.pacienteId,
        medicoId: createTicketDto.medicoId,
        medicoSolicitanteId: createTicketDto.medicoSolicitanteId,
        tarifaId: primaryTarifaId,
        descripcionAdicional: createTicketDto.descripcionAdicional || ticketItems.map((item) => item.descripcion || 'Servicio').join(', '),
        metodoPago: createTicketDto.metodoPago,
        montoPaciente,
        montoMedico,
        montoClinica,
        montoTecnico,
        nombreTecnico: createTicketDto.nombreTecnico,
        certificadoFormulario: createTicketDto.certificadoFormulario,
        certificadoNumero: createTicketDto.certificadoNumero,
        solicitanteHistoriaClinica: createTicketDto.solicitanteHistoriaClinica,
        cajaDiariaId: caja.id,
        usuarioCreadorId,
      },
      include: {
        paciente: { include: { procedencia: true } },
        medico: true,
        medicoSolicitante: true,
        tarifa: true,
        cajaDiaria: true,
      },
    });

    if (createTicketDto.metodoPago === 'EFECTIVO') {
      await this.prisma.cajaDiaria.update({
        where: { id: caja.id },
        data: { montoEfectivoEsperado: { increment: montoPaciente } },
      });
    } else {
      await this.prisma.cajaDiaria.update({
        where: { id: caja.id },
        data: { montoDigitalEsperado: { increment: montoPaciente } },
      });
    }

    return ticket;
  }

  findAll() {
    return this.prisma.ticket.findMany({
      include: {
        paciente: { include: { procedencia: true } },
        medico: true,
        medicoSolicitante: true,
        tarifa: true,
        cajaDiaria: true,
      },
      orderBy: { creadoEn: 'desc' },
    });
  }

  findOne(id: number) {
    return this.prisma.ticket.findUnique({
      where: { id },
      include: {
        paciente: { include: { procedencia: true } },
        medico: true,
        medicoSolicitante: true,
        tarifa: true,
        cajaDiaria: true,
      },
    });
  }

  update(id: number, updateTicketDto: UpdateTicketDto) {
    return this.prisma.ticket.update({
      where: { id },
      data: updateTicketDto,
    });
  }

  async remove(id: number) {
    return this.prisma.ticket.update({
      where: { id },
      data: { estado: 'ANULADO' },
    });
  }
}
