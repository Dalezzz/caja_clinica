import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto, TicketItemDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { SunatService } from '../sunat/sunat.service';
import { FarmaciaService } from '../farmacia/farmacia.service';
import { TipoMovimientoKardex } from '@prisma/client';

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(
    private prisma: PrismaService,
    private sunatService: SunatService,
    private farmaciaService: FarmaciaService,
  ) { }

  async create(createTicketDto: CreateTicketDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Obtener y bloquear conceptualmente la caja diaria abierta
      const caja = await tx.cajaDiaria.findFirst({
        where: { abierta: true },
        orderBy: { fecha: 'desc' },
      });

      if (!caja) {
        throw new NotFoundException('No hay caja diaria abierta');
      }

      // 2. Normalizar ítems
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

      const tarifasDB = await tx.tarifa.findMany({
        where: { id: { in: tarifaIds } },
      });

      if (tarifasDB.length === 0) {
        throw new NotFoundException('Tarifas no encontradas');
      }

      let montoPaciente = 0;
      let montoMedico = 0;
      let montoTecnico = 0;

      // 3. Validar tarifas y preparar ítems
      const itemsToCreate = ticketItemsInput.map((itemInput) => {
        const tarifa = tarifasDB.find((t) => t.id === itemInput.tarifaId);
        if (!tarifa) {
          throw new NotFoundException(
            `Tarifa ID ${itemInput.tarifaId} no encontrada`,
          );
        }

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
          ...(itemInput.productoId && {
            productoId: itemInput.productoId,
            cantidadInsumo: itemInput.cantidadInsumo ?? 1,
          }),
        };
      });

      // 4. Validación y Descuento SÍNCRONO y BLOQUEANTE de Stock en Farmacia (Fase 4 & ERP Fix)
      const itemsConInsumo = itemsToCreate.filter((i) => i.productoId);
      for (const item of itemsConInsumo) {
        const prod = await tx.producto.findUnique({
          where: { id: item.productoId! },
        });

        if (!prod || !prod.activo) {
          throw new NotFoundException(
            `El insumo/producto ID ${item.productoId} no existe o no está activo.`,
          );
        }

        const stockDisponible = Number(prod.stockActual);
        const totalRequerido = (Number(item.cantidadInsumo) || 1) * item.cantidad;

        if (stockDisponible < totalRequerido) {
          throw new BadRequestException(
            `Stock insuficiente para "${prod.nombre}". Disponible: ${stockDisponible} ${prod.unidadMedida}, requerido para venta: ${totalRequerido} ${prod.unidadMedida}.`,
          );
        }

        const nuevoStock = stockDisponible - totalRequerido;

        // Actualizar stock del producto dentro de la transacción
        await tx.producto.update({
          where: { id: prod.id },
          data: { stockActual: nuevoStock },
        });

        // Registrar movimiento Kardex de SALIDA
        await tx.movimientoKardex.create({
          data: {
            productoId: prod.id,
            tipo: TipoMovimientoKardex.SALIDA,
            cantidad: totalRequerido,
            saldoResultante: nuevoStock,
            motivo: `Venta POS - ${item.descripcion}`,
          },
        });
      }

      // 5. Cálculos de comisiones y montos
      const montoSolicitante = Number(createTicketDto.montoSolicitante || 0);
      const ajusteSolicitante = Math.min(
        Math.max(0, montoSolicitante),
        Math.round(montoPaciente * 0.19),
      );

      const montoClinica = Math.max(
        0,
        montoPaciente - montoMedico - montoTecnico - ajusteSolicitante,
      );

      // 6. Generación correlativa atómica de ticket
      const countTicketsCaja = await tx.ticket.count({
        where: { cajaDiariaId: caja.id },
      });
      const nextTicketNumber = countTicketsCaja + 1;
      const numeroTicket = `${caja.fecha.toISOString().split('T')[0]}-${String(nextTicketNumber).padStart(4, '0')}`;

      const usuarioCreadorId =
        ((createTicketDto as any).usuarioCreadorId as number) || 1;

      // 7. Crear el Ticket
      const ticket = await tx.ticket.create({
        data: {
          numeroTicket,
          pacienteId: createTicketDto.pacienteId,
          medicoId: createTicketDto.medicoId,
          medicoSolicitanteId: createTicketDto.medicoSolicitanteId,
          tarifaId: itemsToCreate[0].tarifaId,
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
          solicitanteHistoriaClinica:
            createTicketDto.solicitanteHistoriaClinica,
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

      // 8. Actualizar saldo esperado de caja diaria ATÓMICAMENTE
      if (createTicketDto.metodoPago === 'EFECTIVO') {
        await tx.cajaDiaria.update({
          where: { id: caja.id },
          data: { montoEfectivoEsperado: { increment: montoPaciente } },
        });
      } else {
        await tx.cajaDiaria.update({
          where: { id: caja.id },
          data: { montoDigitalEsperado: { increment: montoPaciente } },
        });
      }

      // Autoemisión SUNAT en segundo plano
      const ajustes = await tx.ajustes.findFirst();
      if (
        ajustes?.sunatAutoEmitir &&
        ajustes?.sunatRuc &&
        ajustes?.sunatUsuario &&
        ajustes?.sunatClave
      ) {
        this.sunatService.emitirBoleta(ticket.id).catch((err) => {
          this.logger.error(
            `Error en autoemisión SUNAT para ticket ${ticket.id}: ${err.message}`,
          );
        });
      }

      return ticket;
    });
  }

  findAll(take: number = 300) {
    return this.prisma.ticket.findMany({
      take,
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
    return this.prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.findUnique({ where: { id } });
      if (!ticket) throw new NotFoundException('Ticket no encontrado');
      if (ticket.estado === 'ANULADO') return ticket;

      const ticketActualizado = await tx.ticket.update({
        where: { id },
        data: { estado: 'ANULADO' },
      });

      if (ticket.metodoPago === 'EFECTIVO') {
        await tx.cajaDiaria.update({
          where: { id: ticket.cajaDiariaId },
          data: {
            montoEfectivoEsperado: {
              decrement: Number(ticket.montoPaciente),
            },
          },
        });
      } else {
        await tx.cajaDiaria.update({
          where: { id: ticket.cajaDiariaId },
          data: {
            montoDigitalEsperado: {
              decrement: Number(ticket.montoPaciente),
            },
          },
        });
      }

      return ticketActualizado;
    });
  }
}
