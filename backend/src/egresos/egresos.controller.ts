import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { EgresosService } from './egresos.service';
import { CreateEgresoDto } from './dto/create-egreso.dto';
import { UpdateEgresoDto } from './dto/update-egreso.dto';

@Controller('egresos')
export class EgresosController {
  constructor(private readonly egresosService: EgresosService) {}

  @Post()
  create(@Body() createEgresoDto: CreateEgresoDto) {
    return this.egresosService.create(createEgresoDto);
  }

  @Get()
  findAll() {
    return this.egresosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.egresosService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEgresoDto: UpdateEgresoDto) {
    return this.egresosService.update(+id, updateEgresoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.egresosService.remove(+id);
  }
}
