import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { FarmaciaController } from './farmacia.controller';
import { FarmaciaService } from './farmacia.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({ storage: memoryStorage() }),
  ],
  controllers: [FarmaciaController],
  providers: [FarmaciaService],
  exports: [FarmaciaService], // Exportado para uso en Fase 4 (TicketsService)
})
export class FarmaciaModule {}
