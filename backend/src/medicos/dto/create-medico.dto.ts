import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateMedicoDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  especialidad: string;

  @IsString()
  @IsNotEmpty()
  grado: string;

  @IsOptional()
  @IsString()
  cmp?: string;

  @IsOptional()
  @IsString()
  celular?: string;

  @IsOptional()
  @IsString()
  consultorioAsignado?: string;
}
