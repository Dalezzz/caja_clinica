import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateTarifaDto {
  @IsString()
  @IsNotEmpty()
  categoria: string;

  @IsString()
  @IsNotEmpty()
  especialidad: string;

  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @IsNumber()
  precioTotal: number;

  @IsString()
  @IsNotEmpty()
  tipoReparto: string;

  @IsNumber()
  comisionMedico: number;

  @IsNumber()
  comisionClinica: number;

  @IsOptional()
  @IsBoolean()
  requiereTecnico?: boolean;

  @IsOptional()
  @IsNumber()
  comisionTecnico?: number;
}
