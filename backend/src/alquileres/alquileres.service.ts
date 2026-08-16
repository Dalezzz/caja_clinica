import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAlquilerDto } from './dto/create-alquiler.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class AlquileresService {
  constructor(private prisma: PrismaService) {}

  async create(createAlquilerDto: CreateAlquilerDto, usuarioCreadorId?: number) {
    let creadorId = usuarioCreadorId;
    if (!creadorId) {
      const admin = await this.prisma.usuario.findFirst({ orderBy: { id: 'asc' } });
      creadorId = admin?.id || 1;
    }

    // Validar que la caja esté abierta para vincular el alquiler
    const caja = await this.prisma.cajaDiaria.findFirst({
      where: { abierta: true },
      orderBy: { fecha: 'desc' },
    });

    if (!caja) {
      throw new NotFoundException('No hay caja diaria abierta');
    }

    const alquiler = await this.prisma.alquilerEspacio.create({
      data: {
        nombre: createAlquilerDto.nombre,
        fechaInicio: new Date(createAlquilerDto.fechaInicio),
        fechaFin: new Date(createAlquilerDto.fechaFin),
        precioTotal: new Decimal(createAlquilerDto.precioTotal),
        arrendatario: createAlquilerDto.arrendatario,
        contacto: createAlquilerDto.contacto,
        observaciones: createAlquilerDto.observaciones,
        cajaDiariaId: caja.id,
        usuarioCreadorId: creadorId,
      },
      include: {
        cajaDiaria: true,
        usuarioCreador: { select: { id: true, nombre: true } },
      },
    });

    // Registrar como ingreso en la caja (si es efectivo)
    await this.prisma.cajaDiaria.update({
      where: { id: caja.id },
      data: { montoEfectivoEsperado: { increment: createAlquilerDto.precioTotal } },
    });

    return alquiler;
  }

  async findAll(filtros?: { estado?: string; medicoId?: number }) {
    return this.prisma.alquilerEspacio.findMany({
      where: filtros?.estado ? { estado: filtros.estado as any } : undefined,
      include: {
        cajaDiaria: true,
        usuarioCreador: { select: { id: true, nombre: true } },
      },
      orderBy: { fechaInicio: 'desc' },
    });
  }

  async findOne(id: number) {
    const alquiler = await this.prisma.alquilerEspacio.findUnique({
      where: { id },
      include: {
        cajaDiaria: true,
        usuarioCreador: { select: { id: true, nombre: true } },
      },
    });

    if (!alquiler) {
      throw new NotFoundException('Alquiler no encontrado');
    }

    return alquiler;
  }

  async finalizarAlquiler(id: number) {
    const alquiler = await this.findOne(id);

    if (alquiler.estado === 'FINALIZADO') {
      throw new Error('El alquiler ya está finalizado');
    }

    return this.prisma.alquilerEspacio.update({
      where: { id },
      data: { estado: 'FINALIZADO' },
      include: {
        cajaDiaria: true,
        usuarioCreador: { select: { id: true, nombre: true } },
      },
    });
  }

  async cancelarAlquiler(id: number) {
    const alquiler = await this.findOne(id);

    // Revertir ingreso de caja si se cancela
    if (alquiler.estado === 'ACTIVO') {
      await this.prisma.cajaDiaria.update({
        where: { id: alquiler.cajaDiariaId },
        data: { montoEfectivoEsperado: { decrement: alquiler.precioTotal } },
      });
    }

    return this.prisma.alquilerEspacio.update({
      where: { id },
      data: { estado: 'CANCELADO' },
      include: {
        cajaDiaria: true,
        usuarioCreador: { select: { id: true, nombre: true } },
      },
    });
  }

  async obtenerAlquileresActivos() {
    return this.prisma.alquilerEspacio.findMany({
      where: { estado: 'ACTIVO' },
      include: {
        cajaDiaria: true,
        usuarioCreador: { select: { id: true, nombre: true } },
      },
      orderBy: { fechaInicio: 'desc' },
    });
  }

  async obtenerIngresosPorAlquileresPeriodo(fechaInicio: Date, fechaFin: Date) {
    const alquileres = await this.prisma.alquilerEspacio.findMany({
      where: {
        estado: { in: ['ACTIVO', 'FINALIZADO'] },
        fechaInicio: { gte: fechaInicio },
        fechaFin: { lte: fechaFin },
      },
    });

    const totalIngresos = alquileres.reduce((sum, a) => sum + Number(a.precioTotal), 0);
    return { totalAlquileres: alquileres.length, totalIngresos, detalles: alquileres };
  }
}
