import { PartialType } from '@nestjs/mapped-types';
import { CreateProcedenciaDto } from './create-procedencia.dto';

export class UpdateProcedenciaDto extends PartialType(CreateProcedenciaDto) {}
