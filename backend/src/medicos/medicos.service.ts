import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMedicoDto } from './dto/create-medico.dto';
import { UpdateMedicoDto } from './dto/update-medico.dto';

@Injectable()
export class MedicosService {
  constructor(private prisma: PrismaService) {}

  create(createMedicoDto: CreateMedicoDto) {
    return this.prisma.medico.create({ data: createMedicoDto });
  }

  findAll() {
    return this.prisma.medico.findMany();
  }

  findOne(id: number) {
    return this.prisma.medico.findUnique({ where: { id } });
  }

  update(id: number, updateMedicoDto: UpdateMedicoDto) {
    return this.prisma.medico.update({ where: { id }, data: updateMedicoDto });
  }

  remove(id: number) {
    return this.prisma.medico.delete({ where: { id } });
  }
}
