import { Module } from '@nestjs/common';
import { ImportadorService } from './importador.service';
import { ImportadorController } from './importador.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ImportadorController],
  providers: [ImportadorService],
})
export class ImportadorModule {}
