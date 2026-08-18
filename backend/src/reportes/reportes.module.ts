import { Module } from '@nestjs/common';
import { WhatsAppReporterService } from './whatsapp-reporter.service';
import { ReportesController } from './reportes.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EstadisticasMedicoModule } from '../estadisticas-medico/estadisticas-medico.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [PrismaModule, EstadisticasMedicoModule, WhatsappModule],
  controllers: [ReportesController],
  providers: [WhatsAppReporterService],
  exports: [WhatsAppReporterService],
})
export class ReportesModule {}
