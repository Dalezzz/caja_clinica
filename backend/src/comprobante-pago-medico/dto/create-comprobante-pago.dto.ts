import { IsOptional, IsString, IsNumber, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateComprobantePagoMedicoDto {
  @IsNumber()
  medicoId: number;

  @Type(() => Date)
  @IsDate()
  periodoInicio: Date;

  @Type(() => Date)
  @IsDate()
  periodoFin: Date;

  @IsOptional()
  @IsNumber()
  montoDescuento?: number;

  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class FirmarComprobantePagoDto {
  @IsString()
  firmaDigital: string; // Base64 de la firma
}
