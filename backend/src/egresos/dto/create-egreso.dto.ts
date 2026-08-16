import { IsString, IsNotEmpty, IsNumber, IsOptional, IsIn } from 'class-validator';

export class CreateEgresoDto {
  @IsIn(['GASTO', 'PLANILLA', 'PAGO_FIJO', 'DEVOLUCION', 'ASCENSOR', 'OTROS'])
  tipoEgreso: 'GASTO' | 'PLANILLA' | 'PAGO_FIJO' | 'DEVOLUCION' | 'ASCENSOR' | 'OTROS';

  @IsOptional()
  @IsString()
  subcategoria?: string;

  @IsOptional()
  @IsString()
  numeroComprobante?: string;

  @IsOptional()
  @IsString()
  proveedor?: string;

  @IsOptional()
  @IsString()
  ruc?: string;

  @IsString()
  @IsNotEmpty()
  observaciones: string;

  @IsNumber()
  monto: number;

  @IsOptional()
  @IsNumber()
  ticketAnuladoId?: number;
}
