import { Controller, Post, Param, Body, Req } from '@nestjs/common';
import { Request } from 'express';
import { WhatsAppReporterService } from './whatsapp-reporter.service';

@Controller('reportes')
export class ReportesController {
  constructor(private readonly whatsappReporterService: WhatsAppReporterService) {}

  @Post('whatsapp/dia')
  async enviarReporteDia(@Req() req: Request) {
    return this.whatsappReporterService.enviarReporteDia();
  }

  @Post('whatsapp/mensual')
  async enviarReporteMensual(
    @Body('mes') mes: number,
    @Body('anio') anio: number,
  ) {
    return this.whatsappReporterService.enviarReporteMensual(mes, anio);
  }
}
