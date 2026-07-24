import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProcedenciaDto } from './dto/create-procedencia.dto';
import { UpdateProcedenciaDto } from './dto/update-procedencia.dto';

@Injectable()
export class ProcedenciasService {
  constructor(private prisma: PrismaService) {}

  create(createProcedenciaDto: CreateProcedenciaDto) {
    return this.prisma.procedencia.create({ data: createProcedenciaDto });
  }

  findAll() {
    return this.prisma.procedencia.findMany();
  }

  findOne(id: number) {
    return this.prisma.procedencia.findUnique({ where: { id } });
  }

  update(id: number, updateProcedenciaDto: UpdateProcedenciaDto) {
    return this.prisma.procedencia.update({ where: { id }, data: updateProcedenciaDto });
  }

  remove(id: number) {
    return this.prisma.procedencia.delete({ where: { id } });
  }
}
