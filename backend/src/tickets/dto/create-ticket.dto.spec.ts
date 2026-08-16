import { validate } from 'class-validator';
import { TicketsService } from '../tickets.service';
import { CreateTicketDto } from './create-ticket.dto';

describe('CreateTicketDto', () => {
  it('accepts TARJETA as a valid payment method', async () => {
    const dto = new CreateTicketDto();
    Object.assign(dto, {
      pacienteId: 1,
      medicoId: 2,
      tarifaId: 3,
      metodoPago: 'TARJETA',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('calculates totals from multiple ticket items', () => {
    const service = new TicketsService({} as any);

    const totals = (service as any).calculateTicketTotals(
      [
        { tarifaId: 1, descripcion: 'Consulta', precioUnitario: 100, cantidad: 1, comisionMedico: 40, comisionClinica: 40, comisionTecnico: 0 },
        { tarifaId: 2, descripcion: 'Rayos X', precioUnitario: 120, cantidad: 2, comisionMedico: 20, comisionClinica: 90, comisionTecnico: 5 },
      ],
      99,
    );

    expect(totals.montoPaciente).toBe(340);
    expect(totals.montoMedico).toBe(80);
    expect(totals.montoClinica).toBe(185);
    expect(totals.montoTecnico).toBe(10);
    expect(totals.tarifaId).toBe(1);
  });
});
