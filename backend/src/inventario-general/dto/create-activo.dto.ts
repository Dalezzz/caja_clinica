import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { EstadoActivo } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateActivoDto {
  @IsString()
  @IsOptional()
  codigoPatrimonial?: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  categoriaNombre?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  categoriaId?: number;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  ubicacionId: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  cantidad?: number;

  @IsEnum(EstadoActivo)
  @IsOptional()
  estado?: EstadoActivo;

  @IsString()
  @IsOptional()
  observaciones?: string;
}
