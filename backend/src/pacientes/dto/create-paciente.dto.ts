import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePacienteDto {
  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  celular?: string;

  @IsOptional()
  @IsString()
  numeroHistoriaClinica?: string;

  @IsNumber()
  procedenciaId: number;
}
