import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CajasDiariasService } from './cajas-diarias.service';
import { CreateCajasDiariaDto } from './dto/create-cajas-diaria.dto';
import { UpdateCajasDiariaDto } from './dto/update-cajas-diaria.dto';

@Controller('cajas-diarias')
export class CajasDiariasController {
  constructor(private readonly cajasDiariasService: CajasDiariasService) {}

  @Post()
  create(@Body() createCajasDiariaDto: CreateCajasDiariaDto) {
    return this.cajasDiariasService.create(createCajasDiariaDto);
  }

  @Get('current')
  findCurrent() {
    return this.cajasDiariasService.findCurrent();
  }

  @Get()
  findAll() {
    return this.cajasDiariasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cajasDiariasService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCajasDiariaDto: UpdateCajasDiariaDto) {
    return this.cajasDiariasService.update(+id, updateCajasDiariaDto);
  }

  @Post(':id/close')
  closeCaja(
    @Param('id') id: string,
    @Body() body: { montoReal: number; observaciones?: string },
  ) {
    return this.cajasDiariasService.closeCaja(+id, body.montoReal, body.observaciones);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cajasDiariasService.remove(+id);
  }
}
