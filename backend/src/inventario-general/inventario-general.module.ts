import { Module } from '@nestjs/common';
import { InventarioGeneralService } from './inventario-general.service';
import { InventarioGeneralController } from './inventario-general.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InventarioGeneralController],
  providers: [InventarioGeneralService],
  exports: [InventarioGeneralService],
})
export class InventarioGeneralModule {}
