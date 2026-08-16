import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTarifaDto } from './dto/create-tarifa.dto';
import { UpdateTarifaDto } from './dto/update-tarifa.dto';

@Injectable()
export class TarifasService {
  constructor(private prisma: PrismaService) {}

  create(createTarifaDto: CreateTarifaDto) {
    return this.prisma.tarifa.create({ data: createTarifaDto });
  }

  findAll() {
    return this.prisma.tarifa.findMany();
  }

  findOne(id: number) {
    return this.prisma.tarifa.findUnique({ where: { id } });
  }

  update(id: number, updateTarifaDto: UpdateTarifaDto) {
    return this.prisma.tarifa.update({ where: { id }, data: updateTarifaDto });
  }

  remove(id: number) {
    return this.prisma.tarifa.delete({ where: { id } });
  }
}
