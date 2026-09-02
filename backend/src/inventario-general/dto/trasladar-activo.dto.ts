import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class TrasladarActivoDto {
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  nuevaUbicacionId: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  cantidadATrasladar?: number;

  @IsString()
  @IsOptional()
  motivo?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  usuarioId?: number;
}
