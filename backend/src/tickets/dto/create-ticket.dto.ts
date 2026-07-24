export class CreateTicketDto {
  pacienteId: number;
  medicoId: number;
  medicoSolicitanteId?: number;
  tarifaId: number;
  descripcionAdicional?: string;
  metodoPago: 'EFECTIVO' | 'PLIN' | 'TRANSFERENCIA';
  nombreTecnico?: string;
  certificadoFormulario?: string;
  certificadoNumero?: string;
  solicitanteHistoriaClinica?: string;
}
