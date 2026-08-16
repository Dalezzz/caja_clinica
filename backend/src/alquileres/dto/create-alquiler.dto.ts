import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAlquilerDto {
  @IsString()
  nombre: string;

  @Type(() => Date)
  @IsDate()
  fechaInicio: Date;

  @Type(() => Date)
  @IsDate()
  fechaFin: Date;

  @IsNumber()
  precioTotal: number;

  @IsString()
  arrendatario: string;

  @IsOptional()
  @IsString()
  contacto?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
