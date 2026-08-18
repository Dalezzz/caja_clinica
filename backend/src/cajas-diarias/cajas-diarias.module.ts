import { Module } from '@nestjs/common';
import { CajasDiariasService } from './cajas-diarias.service';
import { CajasDiariasController } from './cajas-diarias.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ReportesModule } from '../reportes/reportes.module';

@Module({
  imports: [PrismaModule, ReportesModule],
  controllers: [CajasDiariasController],
  providers: [CajasDiariasService],
})
export class CajasDiariasModule {}
