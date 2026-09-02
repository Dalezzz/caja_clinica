import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { TipoUbicacion } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateUbicacionDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsEnum(TipoUbicacion)
  @IsOptional()
  tipo?: TipoUbicacion;

  @IsString()
  @IsOptional()
  piso?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  especialidad?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  medicoId?: number;
}
