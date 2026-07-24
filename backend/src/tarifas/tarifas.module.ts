import { Module } from '@nestjs/common';
import { TarifasService } from './tarifas.service';
import { TarifasController } from './tarifas.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TarifasController],
  providers: [TarifasService],
})
export class TarifasModule {}
