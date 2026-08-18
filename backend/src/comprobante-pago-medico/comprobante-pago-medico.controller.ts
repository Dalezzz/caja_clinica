import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ComprobantePagoMedicoService } from './comprobante-pago-medico.service';
import {
  CreateComprobantePagoMedicoDto,
  FirmarComprobantePagoDto,
} from './dto/create-comprobante-pago.dto';
import { PdfGeneratorService } from '../pdf-generator/pdf-generator.service';

@Controller('comprobantes-pago-medicos')
export class ComprobantePagoMedicoController {
  constructor(
    private readonly comprobantePagoMedicoService: ComprobantePagoMedicoService,
    private readonly pdfGeneratorService: PdfGeneratorService,
  ) {}

  @Post()
  async crear(
    @Req() req: Request,
    @Body() createComprobantePagoMedicoDto: CreateComprobantePagoMedicoDto,
  ) {
    const usuario: any = (req as any).user;
    const usuarioCreadorId = usuario?.sub;

    return this.comprobantePagoMedicoService.generarComprobante(
      createComprobantePagoMedicoDto,
      usuarioCreadorId,
    );
  }

  @Post('generar-dia/:medicoId')
  async generarComprobanteDia(
    @Req() req: Request,
    @Param('medicoId') medicoId: string,
  ) {
    const usuario: any = (req as any).user;
    const usuarioCreadorId = usuario?.sub;

    return this.comprobantePagoMedicoService.generarComprobanteDia(
      +medicoId,
      usuarioCreadorId,
    );
  }

  @Get()
  async findAll() {
    return this.comprobantePagoMedicoService.findAll();
  }

  @Get('medico/:medicoId')
  async findByMedico(@Param('medicoId') medicoId: string) {
    return this.comprobantePagoMedicoService.findAllByMedico(+medicoId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.comprobantePagoMedicoService.findOne(+id);
  }

  @Patch(':id/firmar')
  async firmar(
    @Param('id') id: string,
    @Body() firmarComprobantePagoDto: FirmarComprobantePagoDto,
  ) {
    return this.comprobantePagoMedicoService.firmarComprobante(
      +id,
      firmarComprobantePagoDto,
    );
  }

  @Get(':id/descargar-pdf')
  async descargarPdf(@Param('id') id: string, @Res() res: Response) {
    const comprobante = await this.comprobantePagoMedicoService.findOne(+id);

    if (!comprobante.documentoPdfPath) {
      return res
        .status(404)
        .json({
          error: 'PDF no generado. El comprobante debe ser firmado primero.',
        });
    }

    if (
      !this.pdfGeneratorService.existeComprobante(comprobante.documentoPdfPath)
    ) {
      return res
        .status(404)
        .json({ error: 'Archivo PDF no encontrado en el servidor.' });
    }

    const stream = this.pdfGeneratorService.obtenerStreamComprobante(
      comprobante.documentoPdfPath,
    );
    const filename = `comprobante_${comprobante.id}_${comprobante.medico.nombre.replace(/\s+/g, '_')}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    stream.pipe(res);
  }

  @Patch(':id/cancelar')
  async cancelar(@Param('id') id: string) {
    return this.comprobantePagoMedicoService.cancelarComprobante(+id);
  }
}
