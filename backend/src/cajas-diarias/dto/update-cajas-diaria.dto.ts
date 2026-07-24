import { PartialType } from '@nestjs/mapped-types';
import { CreateCajasDiariaDto } from './create-cajas-diaria.dto';

export class UpdateCajasDiariaDto extends PartialType(CreateCajasDiariaDto) {}
