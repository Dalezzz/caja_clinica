import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCajasDiariaDto } from './dto/create-cajas-diaria.dto';
import { UpdateCajasDiariaDto } from './dto/update-cajas-diaria.dto';

@Injectable()
export class CajasDiariasService {
  constructor(private prisma: PrismaService) {}

  create(createCajasDiariaDto: CreateCajasDiariaDto) {
    return this.prisma.cajaDiaria.create({
      data: {
        fecha: new Date(),
        montoApertura: createCajasDiariaDto.montoApertura,
        montoEfectivoEsperado: createCajasDiariaDto.montoApertura,
        abierta: true,
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

  async closeCaja(id: number, montoReal: number, observaciones?: string) {
    const caja = await this.prisma.cajaDiaria.findUnique({ where: { id } });
    if (!caja) throw new Error('Caja no encontrada');

    const diferencia = montoReal - Number(caja.montoEfectivoEsperado);

    return this.prisma.cajaDiaria.update({
      where: { id },
      data: {
        montoEfectivoReal: montoReal,
        diferenciaCierre: diferencia,
        abierta: false,
        fechaCierre: new Date(),
        observaciones,
      },
    });
  }

  remove(id: number) {
    return this.prisma.cajaDiaria.delete({ where: { id } });
  }
}
