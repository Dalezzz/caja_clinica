import { IsEnum, IsNumber, IsOptional, IsString, IsPositive } from 'class-validator';
import { TipoMovimientoKardex } from '@prisma/client';

export class CreateMovimientoDto {
  @IsNumber()
  productoId: number;

  @IsEnum(TipoMovimientoKardex)
  tipo: TipoMovimientoKardex;

  @IsNumber()
  @IsPositive({ message: 'La cantidad debe ser un valor positivo mayor a 0' })
  cantidad: number;

  @IsOptional()
  @IsString()
  motivo?: string;
}
