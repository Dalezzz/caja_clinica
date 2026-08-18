import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCajasDiariaDto } from './dto/create-cajas-diaria.dto';
import { UpdateCajasDiariaDto } from './dto/update-cajas-diaria.dto';

@Injectable()
export class CajasDiariasService {
  constructor(private prisma: PrismaService) {}

  async create(createCajasDiariaDto: CreateCajasDiariaDto) {
    let usuarioAperturaId = (createCajasDiariaDto as any).usuarioAperturaId as
      number | undefined;

    if (!usuarioAperturaId) {
      const admin = await this.prisma.usuario.findFirst({
        orderBy: { id: 'asc' },
      });
      usuarioAperturaId = admin?.id || 1;
    }

    return this.prisma.cajaDiaria.create({
      data: {
        fecha: new Date(),
        montoApertura: createCajasDiariaDto.montoApertura,
        montoEfectivoEsperado: createCajasDiariaDto.montoApertura,
        abierta: true,
        usuarioAperturaId,
      },
    });
  }

  findAll() {
    return this.prisma.cajaDiaria.findMany({
      include: { tickets: true, egresos: true },
      orderBy: { fecha: 'desc' },
    });
  }

  findOne(id: number) {
    return this.prisma.cajaDiaria.findUnique({
      where: { id },
      include: { tickets: true, egresos: true },
    });
  }

  findCurrent() {
    return this.prisma.cajaDiaria.findFirst({
      where: { abierta: true },
      orderBy: { fecha: 'desc' },
      include: { tickets: true, egresos: true },
    });
  }

  update(id: number, updateCajasDiariaDto: UpdateCajasDiariaDto) {
    return this.prisma.cajaDiaria.update({
      where: { id },
      data: updateCajasDiariaDto,
    });
  }

  async closeCaja(
    id: number,
    montoReal: number,
    observaciones?: string,
    usuarioCierreId?: number,
  ) {
    const caja = await this.prisma.cajaDiaria.findUnique({ where: { id } });
    if (!caja) throw new NotFoundException('Caja no encontrada');

    let cierreUserId = usuarioCierreId;
    if (!cierreUserId) {
      const admin = await this.prisma.usuario.findFirst({
        orderBy: { id: 'asc' },
      });
      cierreUserId = admin?.id || 1;
    }

    const diferencia = montoReal - Number(caja.montoEfectivoEsperado);

    return this.prisma.cajaDiaria.update({
      where: { id },
      data: {
        montoEfectivoReal: montoReal,
        diferenciaCierre: diferencia,
        abierta: false,
        fechaCierre: new Date(),
        observaciones,
        usuarioCierreId: cierreUserId,
      },
    });
  }

  remove(id: number) {
    return this.prisma.cajaDiaria.delete({ where: { id } });
  }
}
