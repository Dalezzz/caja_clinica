import { Injectable, BadRequestException } from '@nestjs/common';
import { EstadisticasMedicoService } from '../estadisticas-medico/estadisticas-medico.service';
import { PrismaService } from '../prisma/prisma.service';

export interface ConfiguracionWhatsApp {
  enabled: boolean;
  numeroNegocio: string;
  tokensGerentes: string[]; // Números de teléfono de dueños/gerentes
  proveedorAPI: 'twilio' | 'whatsapp_business' | 'dummy';
}

@Injectable()
export class WhatsAppReporterService {
  private config: ConfiguracionWhatsApp = {
    enabled: process.env.WHATSAPP_ENABLED === 'true',
    numeroNegocio: process.env.WHATSAPP_NUMERO_NEGOCIO || '+51987654321',
    tokensGerentes: (process.env.WHATSAPP_GERENTES || '').split(',').filter((t) => t.trim()),
    proveedorAPI: (process.env.WHATSAPP_PROVIDER || 'dummy') as any,
  };

  constructor(
    private estadisticasService: EstadisticasMedicoService,
    private prisma: PrismaService,
  ) {}

  async enviarReporteDia() {
    if (!this.config.enabled) {
      throw new BadRequestException('WhatsApp no está habilitado. Configura las variables de entorno.');
    }

    const hoy = new Date();
    const mes = hoy.getMonth() + 1;
    const anio = hoy.getFullYear();

    // Obtener estadísticas del día
    const estadisticas = await this.estadisticasService.obtenerEstadisticaMensual(mes, anio);
    const ranking = estadisticas.sort((a, b) => b.montoPaciente - a.montoPaciente).slice(0, 3);

    // Obtener totales de caja del día
    const caja = await this.prisma.cajaDiaria.findFirst({
      where: {
        fecha: {
          gte: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()),
          lte: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1),
        },
      },
      orderBy: { fecha: 'desc' },
    });

    // Construir resumen ejecutivo
    const mensaje = this.construirMensajeResumen(ranking, caja, mes, anio);

    // Enviar por WhatsApp a cada gerente
    const resultados = [];
    for (const numero of this.config.tokensGerentes) {
      try {
        const resultado = await this.enviarMensaje(numero, mensaje);
        resultados.push({ numero, exito: true, resultado });
      } catch (error: any) {
        resultados.push({ numero, exito: false, error: error.message });
      }
    }

    return {
      resumenReporte: mensaje,
      envios: resultados,
    };
  }

  async enviarReporteMensual(mes: number, anio: number) {
    if (!this.config.enabled) {
      throw new BadRequestException('WhatsApp no está habilitado');
    }

    const estadisticas = await this.estadisticasService.obtenerEstadisticaMensual(mes, anio);
    const ranking = estadisticas.slice(0, 5);

    const totalIngresos = estadisticas.reduce((sum, e) => sum + e.montoPaciente, 0);
    const totalComisiones = estadisticas.reduce((sum, e) => sum + e.montoMedico, 0);

    const mensaje = `
📊 *REPORTE MENSUAL - ${this.getNombreMes(mes)} ${anio}*

📈 *Ingresos Totales:* S/ ${totalIngresos.toFixed(2)}
💰 *Comisiones Pagadas:* S/ ${totalComisiones.toFixed(2)}
👨‍⚕️ *Médicos Activos:* ${estadisticas.length}

*Top 3 Médicos:*
${ranking
  .slice(0, 3)
  .map(
    (e, i) =>
      `${i + 1}. ${e.nombreMedico} - S/ ${e.montoPaciente.toFixed(2)} (${e.totalServicios} servicios)`,
  )
  .join('\n')}

Accede a detalles en el sistema.
    `;

    const resultados = [];
    for (const numero of this.config.tokensGerentes) {
      try {
        const resultado = await this.enviarMensaje(numero, mensaje);
        resultados.push({ numero, exito: true });
      } catch (error: any) {
        resultados.push({ numero, exito: false, error: error.message });
      }
    }

    return { mensajeMensual: mensaje, envios: resultados };
  }

  private construirMensajeResumen(ranking: any, caja: any, mes: number, anio: number) {
    return `
🏥 *RESUMEN DEL DÍA - Caja Clínica*
📅 ${new Date().toLocaleDateString('es-PE')}

💵 *Caja:*
  • Efectivo Esperado: S/ ${Number(caja?.montoEfectivoEsperado || 0).toFixed(2)}
  • Digital Esperado: S/ ${Number(caja?.montoDigitalEsperado || 0).toFixed(2)}

⭐ *Top Médicos Hoy:*
${ranking
  .map(
    (e: any, i: number) =>
      `${i + 1}. ${e.nombreMedico}\n   S/ ${e.montoPaciente.toFixed(2)} (${e.totalServicios} atenciones)`,
  )
  .join('\n')}

✅ Reportes generados automáticamente.
    `;
  }

  private async enviarMensaje(numero: string, mensaje: string): Promise<any> {
    // Normalizar número (agregar código de país si no lo tiene)
    let numeroFormato = numero.replace(/\D/g, '');
    if (!numeroFormato.startsWith('51')) {
      numeroFormato = '51' + numeroFormato;
    }

    switch (this.config.proveedorAPI) {
      case 'twilio':
        return this.enviarPorTwilio(numeroFormato, mensaje);
      case 'whatsapp_business':
        return this.enviarPorWhatsAppBusiness(numeroFormato, mensaje);
      case 'dummy':
      default:
        return this.enviarPorDummy(numeroFormato, mensaje);
    }
  }

  private async enviarPorTwilio(numero: string, mensaje: string) {
    // TODO: Implementar con cliente Twilio real
    // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // return client.messages.create({
    //   from: `whatsapp:${this.config.numeroNegocio}`,
    //   to: `whatsapp:+${numero}`,
    //   body: mensaje,
    // });
    console.log(`[TWILIO] Enviando a +${numero}: ${mensaje}`);
    return { status: 'enviado_twilio', numero };
  }

  private async enviarPorWhatsAppBusiness(numero: string, mensaje: string) {
    // TODO: Implementar con API de WhatsApp Business directamente
    console.log(`[WHATSAPP_BUSINESS] Enviando a +${numero}: ${mensaje}`);
    return { status: 'enviado_whatsapp', numero };
  }

  private async enviarPorDummy(numero: string, mensaje: string) {
    // Modo dummy para testing/desarrollo
    console.log(`[DUMMY] Mensajes WhatsApp a +${numero}:\n${mensaje}`);
    return { status: 'simulado', numero, mensaje };
  }

  private getNombreMes(mes: number): string {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return meses[mes - 1];
  }
}
