import { Module } from '@nestjs/common';
import { WhatsAppReporterService } from './whatsapp-reporter.service';
import { ReportesController } from './reportes.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EstadisticasMedicoModule } from '../estadisticas-medico/estadisticas-medico.module';

@Module({
  imports: [PrismaModule, EstadisticasMedicoModule],
  controllers: [ReportesController],
  providers: [WhatsAppReporterService],
  exports: [WhatsAppReporterService],
})
export class ReportesModule {}
