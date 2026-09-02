import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { InventarioGeneralService } from './inventario-general.service';
import { TipoUbicacion, EstadoActivo } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateUbicacionDto } from './dto/create-ubicacion.dto';
import { CreateActivoDto } from './dto/create-activo.dto';
import { TrasladarActivoDto } from './dto/trasladar-activo.dto';

@UseGuards(JwtAuthGuard)
@Controller('inventario-general')
export class InventarioGeneralController {
  constructor(
    private readonly inventarioService: InventarioGeneralService,
  ) {}

  @Get('ubicaciones')
  async getUbicaciones(
    @Query('busqueda') busqueda?: string,
    @Query('tipo') tipo?: TipoUbicacion,
  ) {
    return this.inventarioService.findAllUbicaciones(busqueda, tipo);
  }

  @Get('ubicaciones/:id')
  async getUbicacionById(@Param('id', ParseIntPipe) id: number) {
    return this.inventarioService.findOneUbicacion(id);
  }

  @Post('ubicaciones')
  async createUbicacion(@Body() body: CreateUbicacionDto) {
    return this.inventarioService.createUbicacion(body);
  }

  @Get('categorias')
  async getCategorias() {
    return this.inventarioService.findAllCategorias();
  }

  @Get('activos')
  async getActivos(
    @Query('busqueda') busqueda?: string,
    @Query('ubicacionId') ubicacionId?: string,
    @Query('categoriaId') categoriaId?: string,
    @Query('estado') estado?: EstadoActivo,
  ) {
    return this.inventarioService.findAllActivos({
      busqueda,
      ubicacionId: ubicacionId ? parseInt(ubicacionId, 10) : undefined,
      categoriaId: categoriaId ? parseInt(categoriaId, 10) : undefined,
      estado,
    });
  }

  @Post('activos')
  async createActivo(@Body() body: CreateActivoDto) {
    return this.inventarioService.createActivo(body);
  }

  @Patch('activos/:id')
  async updateActivo(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Partial<CreateActivoDto>,
  ) {
    return this.inventarioService.updateActivo(id, body);
  }

  @Post('activos/:id/trasladar')
  async trasladarActivo(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: TrasladarActivoDto,
    @Req() req: any,
  ) {
    const usuarioId = req.user?.id || body.usuarioId;
    return this.inventarioService.trasladarActivo(id, { ...body, usuarioId });
  }

  @Get('estadisticas')
  async getEstadisticas() {
    return this.inventarioService.getEstadisticas();
  }
}
