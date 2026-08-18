import { Controller, Post, Param, Body, Req, Get, Patch } from '@nestjs/common';
import { Request } from 'express';
import { WhatsAppReporterService } from './whatsapp-reporter.service';
import { Roles } from '../auth/roles.decorator';
import { RolUsuario } from '@prisma/client';

@Controller('reportes')
export class ReportesController {
  constructor(
    private readonly whatsappReporterService: WhatsAppReporterService,
  ) {}

  @Get('configuracion')
  async obtenerConfiguracion() {
    return this.whatsappReporterService.obtenerAjustes();
  }

  @Patch('configuracion')
  @Roles(RolUsuario.ADMINISTRADOR)
  async guardarConfiguracion(@Body() body: any) {
    return this.whatsappReporterService.guardarAjustes(body);
  }

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
