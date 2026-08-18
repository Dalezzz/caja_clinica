import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface EstadisticaMedicoMensual {
  medicoId: number;
  nombreMedico: string;
  mes: number;
  anio: number;
  totalServicios: number;
  montoPaciente: number;
  montoMedico: number;
  montoClinica: number;
  porcentajeGeneral: number; // porcentaje del total de la clínica ese mes
}

export interface RankingMedicos {
  puesto: number;
  medicoId: number;
  nombreMedico: string;
  montoPaciente: number;
  montoMedico: number;
  servicios: number;
  especialidad: string;
}

@Injectable()
export class EstadisticasMedicoService {
  constructor(private prisma: PrismaService) {}

  async obtenerEstadisticaMensual(
    mes: number,
    anio: number,
  ): Promise<EstadisticaMedicoMensual[]> {
    const inicioMes = new Date(anio, mes - 1, 1);
    const finMes = new Date(anio, mes, 0);

    const tickets = await this.prisma.ticket.findMany({
      where: {
        fecha: {
          gte: inicioMes,
          lte: finMes,
        },
        estado: 'ACTIVO',
      },
      include: {
        medico: true,
      },
    });

    // Agrupar por médico
    const stats: Map<number, any> = new Map();

    tickets.forEach((ticket) => {
      const medicoId = ticket.medicoId;
      if (!stats.has(medicoId)) {
        stats.set(medicoId, {
          medicoId,
          nombreMedico: ticket.medico.nombre,
          totalServicios: 0,
          montoPaciente: 0,
          montoMedico: 0,
          montoClinica: 0,
        });
      }

      const stat = stats.get(medicoId);
      stat.totalServicios += 1;
      stat.montoPaciente += Number(ticket.montoPaciente);
      stat.montoMedico += Number(ticket.montoMedico);
      stat.montoClinica += Number(ticket.montoClinica);
    });

    // Calcular porcentajes
    const totalClinica = Array.from(stats.values()).reduce(
      (sum, s) => sum + s.montoPaciente,
      0,
    );

    const resultado = Array.from(stats.values()).map((stat) => ({
      ...stat,
      mes,
      anio,
      porcentajeGeneral:
        totalClinica > 0 ? (stat.montoPaciente / totalClinica) * 100 : 0,
    }));

    return resultado.sort((a, b) => b.montoPaciente - a.montoPaciente);
  }

  async obtenerRankingMedicosMes(
    mes: number,
    anio: number,
  ): Promise<RankingMedicos[]> {
    const stats = await this.obtenerEstadisticaMensual(mes, anio);

    return stats.map((stat, index) => ({
      puesto: index + 1,
      medicoId: stat.medicoId,
      nombreMedico: stat.nombreMedico,
      montoPaciente: stat.montoPaciente,
      montoMedico: stat.montoMedico,
      servicios: stat.totalServicios,
      especialidad: '', // Lo llenaremos con la consulta de medico
    }));
  }

  async obtenerRankingMedicosMesDetallado(
    mes: number,
    anio: number,
  ): Promise<RankingMedicos[]> {
    const inicioMes = new Date(anio, mes - 1, 1);
    const finMes = new Date(anio, mes, 0);

    const tickets = await this.prisma.ticket.findMany({
      where: {
        fecha: {
          gte: inicioMes,
          lte: finMes,
        },
        estado: 'ACTIVO',
      },
      include: {
        medico: true,
      },
    });

    const stats: Map<number, any> = new Map();

    tickets.forEach((ticket) => {
      const medicoId = ticket.medicoId;
      if (!stats.has(medicoId)) {
        stats.set(medicoId, {
          medicoId,
          nombreMedico: ticket.medico.nombre,
          especialidad: ticket.medico.especialidad,
          montoPaciente: 0,
          montoMedico: 0,
          servicios: 0,
        });
      }

      const stat = stats.get(medicoId);
      stat.montoPaciente += Number(ticket.montoPaciente);
      stat.montoMedico += Number(ticket.montoMedico);
      stat.servicios += 1;
    });

    const resultado = Array.from(stats.values()).sort(
      (a, b) => b.montoPaciente - a.montoPaciente,
    );

    return resultado.map((stat, index) => ({
      puesto: index + 1,
      ...stat,
    }));
  }

  async obtenerComparativaAnual(medicoId: number, anio: number) {
    const resultado = [];

    for (let mes = 1; mes <= 12; mes++) {
      const inicioMes = new Date(anio, mes - 1, 1);
      const finMes = new Date(anio, mes, 0);

      const tickets = await this.prisma.ticket.findMany({
        where: {
          medicoId,
          fecha: {
            gte: inicioMes,
            lte: finMes,
          },
          estado: 'ACTIVO',
        },
      });

      const montoPaciente = tickets.reduce(
        (sum, t) => sum + Number(t.montoPaciente),
        0,
      );
      const montoMedico = tickets.reduce(
        (sum, t) => sum + Number(t.montoMedico),
        0,
      );

      resultado.push({
        mes,
        nombreMes: new Date(anio, mes - 1).toLocaleString('es-PE', {
          month: 'long',
        }),
        totalServicios: tickets.length,
        montoPaciente,
        montoMedico,
      });
    }

    return resultado;
  }

  async obtenerCrecimientoMensual(medicoId: number, mes: number, anio: number) {
    const mesActual = await this.obtenerEstadisticaMensual(mes, anio);
    const mesPasado = await this.obtenerEstadisticaMensual(
      mes === 1 ? 12 : mes - 1,
      mes === 1 ? anio - 1 : anio,
    );

    const statsActual = mesActual.find((s) => s.medicoId === medicoId);
    const statsPasado = mesPasado.find((s) => s.medicoId === medicoId);

    const montoPasado = statsPasado?.montoPaciente || 0;
    const montoActual = statsActual?.montoPaciente || 0;
    const crecimiento =
      montoPasado > 0 ? ((montoActual - montoPasado) / montoPasado) * 100 : 0;

    return {
      medicoId,
      mesPasado: montoPasado,
      mesActual: montoActual,
      crecimiento,
    };
  }
}
