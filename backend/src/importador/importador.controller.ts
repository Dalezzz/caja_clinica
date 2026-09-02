import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportadorService } from './importador.service';

@Controller('importar')
export class ImportadorController {
  constructor(private readonly importadorService: ImportadorService) {}

  @Post('excel')
  @UseInterceptors(FileInterceptor('file'))
  async importarExcel(
    @UploadedFile() file: any,
    @Query('dryRun') dryRunQuery?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Se requiere subir un archivo Excel.');
    }

    const dryRun = dryRunQuery !== 'false'; // Por defecto es true para seguridad

    return this.importadorService.importarExcel(
      file.buffer,
      dryRun,
      file.originalname || 'Importacion.xlsx',
    );
  }

  @Post('inventario-general')
  @UseInterceptors(FileInterceptor('file'))
  async importarInventarioGeneral(
    @UploadedFile() file: any,
    @Query('dryRun') dryRunQuery?: string,
    @Query('force') forceQuery?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Se requiere subir un archivo Excel.');
    }

    const dryRun = dryRunQuery === 'true';
    const force = forceQuery === 'true';

    return this.importadorService.importarInventarioGeneralExcel(
      file.buffer,
      dryRun,
      file.originalname || 'INVENTARIO AGOSTO.xlsx',
      force,
    );
  }
}
