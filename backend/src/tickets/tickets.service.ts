import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  async create(createTicketDto: CreateTicketDto) {
    // Obtener la caja diaria actual
    const caja = await this.prisma.cajaDiaria.findFirst({
      where: { abierta: true },
      orderBy: { fecha: 'desc' },
    });

    if (!caja) {
      throw new NotFoundException('No hay caja diaria abierta');
    }

    // Obtener la tarifa
    const tarifa = await this.prisma.tarifa.findUnique({
      where: { id: createTicketDto.tarifaId },
    });

    if (!tarifa) {
      throw new NotFoundException('Tarifa no encontrada');
    }

    // Generar número de ticket (correlativo diario)
    const lastTicket = await this.prisma.ticket.findFirst({
      where: { cajaDiariaId: caja.id },
      orderBy: { id: 'desc' },
    });

    const nextTicketNumber = lastTicket
      ? parseInt(lastTicket.numeroTicket.split('-').pop() || '0') + 1
      : 1;
    const numeroTicket = `${caja.fecha.toISOString().split('T')[0]}-${String(nextTicketNumber).padStart(4, '0')}`;

    // Calcular montos
    const montoPaciente = tarifa.precioTotal;
    const montoMedico = tarifa.comisionMedico;
    const montoClinica = tarifa.comisionClinica;
    const montoTecnico = tarifa.requiereTecnico ? tarifa.comisionTecnico : 0;

    // Crear el ticket
    const ticket = await this.prisma.ticket.create({
      data: {
        numeroTicket,
        pacienteId: createTicketDto.pacienteId,
        medicoId: createTicketDto.medicoId,
        medicoSolicitanteId: createTicketDto.medicoSolicitanteId,
        tarifaId: createTicketDto.tarifaId,
        descripcionAdicional: createTicketDto.descripcionAdicional,
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
      },
      include: {
        paciente: { include: { procedencia: true } },
        medico: true,
        medicoSolicitante: true,
        tarifa: true,
        cajaDiaria: true,
      },
    });

    // Actualizar caja diaria
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
