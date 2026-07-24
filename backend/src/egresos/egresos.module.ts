import { Module } from '@nestjs/common';
import { EgresosService } from './egresos.service';
import { EgresosController } from './egresos.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EgresosController],
  providers: [EgresosService],
})
export class EgresosModule {}
