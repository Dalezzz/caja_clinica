import { IsNumber } from 'class-validator';

export class CreateCajasDiariaDto {
  @IsNumber()
  montoApertura: number;
}
