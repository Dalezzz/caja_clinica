import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProcedenciasService } from './procedencias.service';
import { CreateProcedenciaDto } from './dto/create-procedencia.dto';
import { UpdateProcedenciaDto } from './dto/update-procedencia.dto';

@Controller('procedencias')
export class ProcedenciasController {
  constructor(private readonly procedenciasService: ProcedenciasService) {}

  @Post()
  create(@Body() createProcedenciaDto: CreateProcedenciaDto) {
    return this.procedenciasService.create(createProcedenciaDto);
  }

  @Get()
  findAll() {
    return this.procedenciasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.procedenciasService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProcedenciaDto: UpdateProcedenciaDto) {
    return this.procedenciasService.update(+id, updateProcedenciaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.procedenciasService.remove(+id);
  }
}
