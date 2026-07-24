export class CreateTarifaDto {
  categoria: string;
  especialidad: string;
  descripcion: string;
  precioTotal: number;
  tipoReparto: string;
  comisionMedico: number;
  comisionClinica: number;
  requiereTecnico?: boolean;
  comisionTecnico?: number;
}
