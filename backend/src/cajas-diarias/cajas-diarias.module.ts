import { Module } from '@nestjs/common';
import { CajasDiariasService } from './cajas-diarias.service';
import { CajasDiariasController } from './cajas-diarias.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CajasDiariasController],
  providers: [CajasDiariasService],
})
export class CajasDiariasModule {}
