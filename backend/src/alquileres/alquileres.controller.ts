import { Controller, Get, Post, Body, Patch, Param, Req, Query } from '@nestjs/common';
import { Request } from 'express';
import { AlquileresService } from './alquileres.service';
import { CreateAlquilerDto } from './dto/create-alquiler.dto';

@Controller('alquileres')
export class AlquileresController {
  constructor(private readonly alquileresService: AlquileresService) {}

  @Post()
  async create(@Req() req: Request, @Body() createAlquilerDto: CreateAlquilerDto) {
    const usuario: any = (req as any).user;
    const usuarioCreadorId = usuario?.sub;

    return this.alquileresService.create(createAlquilerDto, usuarioCreadorId);
  }

  @Get()
  async findAll(@Query('estado') estado?: string) {
    return this.alquileresService.findAll({ estado });
  }

  @Get('activos/list')
  async getActivos() {
    return this.alquileresService.obtenerAlquileresActivos();
  }

  @Get('ingresos/:inicio/:fin')
  async getIngresosPeriodo(@Param('inicio') inicio: string, @Param('fin') fin: string) {
    return this.alquileresService.obtenerIngresosPorAlquileresPeriodo(
      new Date(inicio),
      new Date(fin),
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.alquileresService.findOne(+id);
  }

  @Patch(':id/finalizar')
  async finalizarAlquiler(@Param('id') id: string) {
    return this.alquileresService.finalizarAlquiler(+id);
  }

  @Patch(':id/cancelar')
  async cancelarAlquiler(@Param('id') id: string) {
    return this.alquileresService.cancelarAlquiler(+id);
  }
}
