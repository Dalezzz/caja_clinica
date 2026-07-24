import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEgresoDto } from './dto/create-egreso.dto';
import { UpdateEgresoDto } from './dto/update-egreso.dto';

@Injectable()
export class EgresosService {
  constructor(private prisma: PrismaService) {}

  async create(createEgresoDto: CreateEgresoDto) {
    // Obtener la caja diaria actual
    const caja = await this.prisma.cajaDiaria.findFirst({
      where: { abierta: true },
      orderBy: { fecha: 'desc' },
    });

    if (!caja) {
      throw new NotFoundException('No hay caja diaria abierta');
    }

    // Crear egreso
    const egreso = await this.prisma.egreso.create({
      data: {
        ...createEgresoDto,
        cajaDiariaId: caja.id,
      },
      include: { cajaDiaria: true },
    });

    // Actualizar caja diaria
    await this.prisma.cajaDiaria.update({
      where: { id: caja.id },
      data: { montoEfectivoEsperado: { decrement: createEgresoDto.monto } },
    });

    return egreso;
  }

  findAll() {
    return this.prisma.egreso.findMany({
      include: { cajaDiaria: true },
      orderBy: { fecha: 'desc' },
    });
  }

  findOne(id: number) {
    return this.prisma.egreso.findUnique({
      where: { id },
      include: { cajaDiaria: true },
    });
  }

  update(id: number, updateEgresoDto: UpdateEgresoDto) {
    return this.prisma.egreso.update({
      where: { id },
      data: updateEgresoDto,
    });
  }

  remove(id: number) {
    return this.prisma.egreso.delete({ where: { id } });
  }
}
