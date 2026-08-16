import { IsArray, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export type MetodoPagoValue = 'EFECTIVO' | 'PLIN' | 'TRANSFERENCIA' | 'TARJETA';

export class TicketItemDto {
  @IsNumber()
  tarifaId: number;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsNumber()
  precioUnitario: number;

  @IsNumber()
  cantidad: number;

  @IsNumber()
  comisionMedico: number;

  @IsNumber()
  comisionClinica: number;

  @IsNumber()
  comisionTecnico: number;
}

export class CreateTicketDto {
  @IsNumber()
  pacienteId: number;

  @IsNumber()
  medicoId: number;

  @IsOptional()
  @IsNumber()
  medicoSolicitanteId?: number;

  @IsOptional()
  @IsNumber()
  tarifaId?: number;

  @IsOptional()
  @IsArray()
  items?: TicketItemDto[];

  @IsOptional()
  @IsNumber()
  montoSolicitante?: number;

  @IsOptional()
  @IsString()
  descripcionAdicional?: string;

  @IsIn(['EFECTIVO', 'PLIN', 'TRANSFERENCIA', 'TARJETA'])
  metodoPago: MetodoPagoValue;

  @IsOptional()
  @IsString()
  nombreTecnico?: string;

  @IsOptional()
  @IsString()
  certificadoFormulario?: string;

  @IsOptional()
  @IsString()
  certificadoNumero?: string;

  @IsOptional()
  @IsString()
  solicitanteHistoriaClinica?: string;
}
