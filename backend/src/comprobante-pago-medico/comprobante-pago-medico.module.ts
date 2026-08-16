import { Module } from '@nestjs/common';
import { ComprobantePagoMedicoService } from './comprobante-pago-medico.service';
import { ComprobantePagoMedicoController } from './comprobante-pago-medico.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PdfGeneratorModule } from '../pdf-generator/pdf-generator.module';

@Module({
  imports: [PrismaModule, PdfGeneratorModule],
  controllers: [ComprobantePagoMedicoController],
  providers: [ComprobantePagoMedicoService],
  exports: [ComprobantePagoMedicoService],
})
export class ComprobantePagoMedicoModule {}
