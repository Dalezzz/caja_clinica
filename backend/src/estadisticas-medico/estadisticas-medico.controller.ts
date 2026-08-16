import { Controller, Get, Param } from '@nestjs/common';
import { EstadisticasMedicoService } from './estadisticas-medico.service';

@Controller('estadisticas-medicos')
export class EstadisticasMedicoController {
  constructor(private readonly estadisticasService: EstadisticasMedicoService) {}

  @Get('mensual/:mes/:anio')
  async obtenerEstadisticaMensual(@Param('mes') mes: string, @Param('anio') anio: string) {
    return this.estadisticasService.obtenerEstadisticaMensual(+mes, +anio);
  }

  @Get('ranking/:mes/:anio')
  async obtenerRanking(@Param('mes') mes: string, @Param('anio') anio: string) {
    return this.estadisticasService.obtenerRankingMedicosMesDetallado(+mes, +anio);
  }

  @Get('anual/:medicoId/:anio')
  async obtenerComparativaAnual(@Param('medicoId') medicoId: string, @Param('anio') anio: string) {
    return this.estadisticasService.obtenerComparativaAnual(+medicoId, +anio);
  }

  @Get('crecimiento/:medicoId/:mes/:anio')
  async obtenerCrecimiento(
    @Param('medicoId') medicoId: string,
    @Param('mes') mes: string,
    @Param('anio') anio: string,
  ) {
    return this.estadisticasService.obtenerCrecimientoMensual(+medicoId, +mes, +anio);
  }
}
