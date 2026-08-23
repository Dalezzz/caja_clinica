import { Controller, Post, Param, Get, Res, ParseIntPipe, InternalServerErrorException } from '@nestjs/common';
import { SunatService } from './sunat.service';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Controller('sunat')
export class SunatController {
  constructor(private readonly sunatService: SunatService) {}

  @Post('emitir/:ticketId')
  async emitirBoleta(@Param('ticketId', ParseIntPipe) ticketId: number) {
    return this.sunatService.emitirBoleta(ticketId);
  }

  @Get('descargar-pdf/:ticketId')
  async descargarPdf(@Param('ticketId', ParseIntPipe) ticketId: number, @Res() res: Response) {
    const pdfPath = await this.sunatService.obtenerRutaPdf(ticketId);
    if (!pdfPath || !fs.existsSync(pdfPath)) {
      throw new InternalServerErrorException('El PDF no existe o aún no ha sido emitido.');
    }
    
    const filename = path.basename(pdfPath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    const fileStream = fs.createReadStream(pdfPath);
    fileStream.pipe(res);
  }
}
