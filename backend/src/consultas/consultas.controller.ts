import { Controller, Get, Param } from '@nestjs/common';
import { ConsultasService } from './consultas.service';

@Controller('consultas')
export class ConsultasController {
  constructor(private readonly consultasService: ConsultasService) {}

  @Get('dni/:dni')
  async consultarDni(@Param('dni') dni: string) {
    return this.consultasService.consultarDni(dni);
  }

  @Get('ruc/:ruc')
  async consultarRuc(@Param('ruc') ruc: string) {
    return this.consultasService.consultarRuc(ruc);
  }
}
