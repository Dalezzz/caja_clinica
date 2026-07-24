import { Module } from '@nestjs/common';
import { ProcedenciasService } from './procedencias.service';
import { ProcedenciasController } from './procedencias.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProcedenciasController],
  providers: [ProcedenciasService],
})
export class ProcedenciasModule {}
