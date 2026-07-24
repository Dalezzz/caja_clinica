export class CreateEgresoDto {
  tipoEgreso: 'GASTO' | 'PLANILLA' | 'PAGO_FIJO' | 'DEVOLUCION' | 'ASCENSOR' | 'OTROS';
  subcategoria?: string;
  numeroComprobante?: string;
  proveedor?: string;
  ruc?: string;
  observaciones: string;
  monto: number;
  ticketAnuladoId?: number;
}
