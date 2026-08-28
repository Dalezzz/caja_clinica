import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FarmaciaService } from './farmacia.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { CreateMovimientoDto } from './dto/create-movimiento.dto';
import { Roles } from '../auth/roles.decorator';
import { RolUsuario } from '@prisma/client';

@Controller('farmacia')
@Roles(RolUsuario.FARMACIA, RolUsuario.ADMINISTRADOR)
export class FarmaciaController {
  constructor(private readonly farmaciaService: FarmaciaService) {}

  // ── Productos ──────────────────────────────────────

  @Get('productos')
  findAllProductos(
    @Query('busqueda') busqueda?: string,
    @Query('categoria') categoria?: string,
  ) {
    return this.farmaciaService.findAllProductos(busqueda, categoria);
  }

  @Get('categorias')
  findCategorias() {
    return this.farmaciaService.findCategorias();
  }

  @Get('productos/:id')
  findProductoById(@Param('id', ParseIntPipe) id: number) {
    return this.farmaciaService.findProductoById(id);
  }

  @Post('productos')
  createProducto(@Body() dto: CreateProductoDto) {
    return this.farmaciaService.createProducto(dto);
  }

  @Patch('productos/:id')
  updateProducto(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateProductoDto>,
  ) {
    return this.farmaciaService.updateProducto(id, dto);
  }

  @Delete('productos/:id')
  desactivarProducto(@Param('id', ParseIntPipe) id: number) {
    return this.farmaciaService.desactivarProducto(id);
  }

  // ── Movimientos Kardex ─────────────────────────────

  @Post('movimiento')
  registrarMovimiento(@Body() dto: CreateMovimientoDto) {
    return this.farmaciaService.registrarMovimiento(dto);
  }

  // ── Importador Excel ───────────────────────────────

  @Post('importar')
  @UseInterceptors(FileInterceptor('archivo'))
  async importarExcel(
    @UploadedFile() archivo: any,
    @Query('contexto') contexto: 'clinica' | 'farmacia' = 'farmacia',
  ) {
    if (!archivo) {
      throw new BadRequestException('No se recibió ningún archivo');
    }
    if (!['clinica', 'farmacia'].includes(contexto)) {
      throw new BadRequestException('El parámetro contexto debe ser "clinica" o "farmacia"');
    }
    return this.farmaciaService.importarDesdeExcel(archivo.buffer, contexto);
  }
}
