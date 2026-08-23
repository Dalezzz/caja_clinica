import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto, TicketItemDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { SunatService } from '../sunat/sunat.service';

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(
    private prisma: PrismaService,
    private sunatService: SunatService,
  ) {}

  async create(createTicketDto: CreateTicketDto) {
    const caja = await this.prisma.cajaDiaria.findFirst({
      where: { abierta: true },
      orderBy: { fecha: 'desc' },
    });

    if (!caja) {
      throw new NotFoundException('No hay caja diaria abierta');
    }

    const ticketItemsInput =
      createTicketDto.items && createTicketDto.items.length > 0
        ? createTicketDto.items
        : [
            {
              tarifaId: createTicketDto.tarifaId as number,
              descripcion: createTicketDto.descripcionAdicional,
              cantidad: 1,
            },
          ];

    const tarifaIds = ticketItemsInput
      .map((item) => item.tarifaId)
      .filter(Boolean);
    if (tarifaIds.length === 0) {
      throw new NotFoundException('No se especificaron tarifas válidas');
    }

    const tarifasDB = await this.prisma.tarifa.findMany({
      where: { id: { in: tarifaIds } },
    });

    if (tarifasDB.length === 0) {
      throw new NotFoundException('Tarifas no encontradas');
    }

    let montoPaciente = 0;
    let montoMedico = 0;
    let montoTecnico = 0;

    const itemsToCreate = ticketItemsInput.map((itemInput) => {
      const tarifa = tarifasDB.find((t) => t.id === itemInput.tarifaId);
      if (!tarifa)
        throw new NotFoundException(
          `Tarifa ID ${itemInput.tarifaId} no encontrada`,
        );

      const cantidad = itemInput.cantidad || 1;
      const precioUnitario = Number(tarifa.precioTotal);
      const comisionMed = Number(tarifa.comisionMedico);
      const comisionTec = tarifa.requiereTecnico
        ? Number(tarifa.comisionTecnico)
        : 0;
      const comisionCli = Number(tarifa.comisionClinica);

      montoPaciente += precioUnitario * cantidad;
      montoMedico += comisionMed * cantidad;
      montoTecnico += comisionTec * cantidad;

      return {
        tarifaId: tarifa.id,
        descripcion: itemInput.descripcion || tarifa.descripcion,
        cantidad,
        precioUnitario,
        comisionMedico: comisionMed,
        comisionTecnico: comisionTec,
        comisionClinica: comisionCli,
      };
    });

    const montoSolicitante = Number(createTicketDto.montoSolicitante || 0);
    const ajusteSolicitante = Math.min(
      Math.max(0, montoSolicitante),
      Math.round(montoPaciente * 0.19),
    );

    const montoClinica = Math.max(
      0,
      montoPaciente - montoMedico - montoTecnico - ajusteSolicitante,
    );

    const lastTicket = await this.prisma.ticket.findFirst({
      where: { cajaDiariaId: caja.id },
      orderBy: { id: 'desc' },
    });

    const nextTicketNumber = lastTicket
      ? Number.parseInt(lastTicket.numeroTicket.split('-').pop() || '0', 10) + 1
      : 1;
    const numeroTicket = `${caja.fecha.toISOString().split('T')[0]}-${String(nextTicketNumber).padStart(4, '0')}`;

    let usuarioCreadorId = (createTicketDto as any).usuarioCreadorId as
      number | undefined;
    if (!usuarioCreadorId) {
      const admin = await this.prisma.usuario.findFirst({
        orderBy: { id: 'asc' },
      });
      usuarioCreadorId = admin?.id || 1;
    }

    const ticket = await this.prisma.ticket.create({
      data: {
        numeroTicket,
        pacienteId: createTicketDto.pacienteId,
        medicoId: createTicketDto.medicoId,
        medicoSolicitanteId: createTicketDto.medicoSolicitanteId,
        tarifaId: itemsToCreate[0].tarifaId, // Guardar también el ID primario para compatibilidad backward
        descripcionAdicional:
          createTicketDto.descripcionAdicional ||
          itemsToCreate.map((i) => i.descripcion).join(', '),
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
        items: {
          create: itemsToCreate,
        },
      },
      include: {
        paciente: { include: { procedencia: true } },
        medico: true,
        medicoSolicitante: true,
        tarifa: true,
        cajaDiaria: true,
        items: { include: { tarifa: true } },
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

    // Comprobar si hay autoemisión SUNAT
    try {
      const ajustes = await this.prisma.ajustes.findFirst();
      if (ajustes?.sunatAutoEmitir && ajustes?.sunatRuc && ajustes?.sunatUsuario && ajustes?.sunatClave) {
        // Lanzamos la emisión en background para no bloquear la respuesta del ticket
        this.logger.log(`Autoemisión activada. Emitiendo boleta para ticket ${ticket.id}...`);
        this.sunatService.emitirBoleta(ticket.id).catch(err => {
          this.logger.error(`Error en autoemisión SUNAT para ticket ${ticket.id}: ${err.message}`);
        });
      }
    } catch (err) {
      this.logger.error(`Error verificando autoemisión SUNAT: ${err.message}`);
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
        items: { include: { tarifa: true } },
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
        items: { include: { tarifa: true } },
      },
    });
  }

  update(id: number, updateTicketDto: UpdateTicketDto) {
    const { items, ...dataToUpdate } = updateTicketDto;
    return this.prisma.ticket.update({
      where: { id },
      data: dataToUpdate as any,
    });
  }

  async remove(id: number) {
    return this.prisma.ticket.update({
      where: { id },
      data: { estado: 'ANULADO' },
    });
  }
}
