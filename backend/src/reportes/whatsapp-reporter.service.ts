import { Injectable, BadRequestException } from '@nestjs/common';
import { EstadisticasMedicoService } from '../estadisticas-medico/estadisticas-medico.service';
import { PrismaService } from '../prisma/prisma.service';

export interface ConfiguracionWhatsApp {
  enabled: boolean;
  numeroNegocio: string;
  tokensGerentes: string[];
  proveedorAPI: 'twilio' | 'whatsapp_business' | 'custom_api' | 'dummy';
  whatsappToken: string;
  whatsappApiUrl: string;
}

@Injectable()
export class WhatsAppReporterService {
  constructor(
    private estadisticasService: EstadisticasMedicoService,
    private prisma: PrismaService,
  ) {}

  async obtenerAjustes() {
    let ajustes = await (this.prisma as any).ajustes.findUnique({
      where: { id: 1 },
    });
    if (!ajustes) {
      ajustes = await (this.prisma as any).ajustes.create({
        data: {
          id: 1,
          whatsappEnabled: process.env.WHATSAPP_ENABLED === 'true',
          whatsappNumeroNegocio: process.env.WHATSAPP_NUMERO_NEGOCIO || '',
          whatsappGerentes: process.env.WHATSAPP_GERENTES || '',
          whatsappProvider: process.env.WHATSAPP_PROVIDER || 'dummy',
          whatsappToken: '',
          whatsappApiUrl: '',
        },
      });
    }
    return ajustes;
  }

  async guardarAjustes(data: any) {
    return (this.prisma as any).ajustes.upsert({
      where: { id: 1 },
      update: {
        whatsappEnabled:
          data.whatsappEnabled === true || data.whatsappEnabled === 'true',
        whatsappNumeroNegocio: data.whatsappNumeroNegocio || '',
        whatsappGerentes: data.whatsappGerentes || '',
        whatsappProvider: data.whatsappProvider || 'dummy',
        whatsappToken: data.whatsappToken || '',
        whatsappApiUrl: data.whatsappApiUrl || '',
      },
      create: {
        id: 1,
        whatsappEnabled:
          data.whatsappEnabled === true || data.whatsappEnabled === 'true',
        whatsappNumeroNegocio: data.whatsappNumeroNegocio || '',
        whatsappGerentes: data.whatsappGerentes || '',
        whatsappProvider: data.whatsappProvider || 'dummy',
        whatsappToken: data.whatsappToken || '',
        whatsappApiUrl: data.whatsappApiUrl || '',
      },
    });
  }

  private async getConfig(): Promise<ConfiguracionWhatsApp> {
    const dbAjustes = await (this.prisma as any).ajustes.findUnique({
      where: { id: 1 },
    });
    if (dbAjustes) {
      return {
        enabled: dbAjustes.whatsappEnabled,
        numeroNegocio: dbAjustes.whatsappNumeroNegocio,
        tokensGerentes: dbAjustes.whatsappGerentes
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        proveedorAPI: dbAjustes.whatsappProvider as any,
        whatsappToken: dbAjustes.whatsappToken,
        whatsappApiUrl: dbAjustes.whatsappApiUrl,
      };
    }
    return {
      enabled: process.env.WHATSAPP_ENABLED === 'true',
      numeroNegocio: process.env.WHATSAPP_NUMERO_NEGOCIO || '+51987654321',
      tokensGerentes: (process.env.WHATSAPP_GERENTES || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      proveedorAPI: (process.env.WHATSAPP_PROVIDER || 'dummy') as any,
      whatsappToken: '',
      whatsappApiUrl: '',
    };
  }

  async enviarReporteDia() {
    const config = await this.getConfig();
    if (!config.enabled) {
      throw new BadRequestException(
        'WhatsApp no está habilitado. Configura las variables en el panel de administración.',
      );
    }

    const hoy = new Date();
    const mes = hoy.getMonth() + 1;
    const anio = hoy.getFullYear();

    // Obtener estadísticas del día
    const estadisticas =
      await this.estadisticasService.obtenerEstadisticaMensual(mes, anio);
    const ranking = estadisticas
      .sort((a, b) => b.montoPaciente - a.montoPaciente)
      .slice(0, 3);

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
    for (const numero of config.tokensGerentes) {
      try {
        const resultado = await this.enviarMensaje(numero, mensaje, config);
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
    const config = await this.getConfig();
    if (!config.enabled) {
      throw new BadRequestException('WhatsApp no está habilitado');
    }

    const estadisticas =
      await this.estadisticasService.obtenerEstadisticaMensual(mes, anio);
    const ranking = estadisticas.slice(0, 5);

    const totalIngresos = estadisticas.reduce(
      (sum, e) => sum + e.montoPaciente,
      0,
    );
    const totalComisiones = estadisticas.reduce(
      (sum, e) => sum + e.montoMedico,
      0,
    );

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
    for (const numero of config.tokensGerentes) {
      try {
        const resultado = await this.enviarMensaje(numero, mensaje, config);
        resultados.push({ numero, exito: true });
      } catch (error: any) {
        resultados.push({ numero, exito: false, error: error.message });
      }
    }

    return { mensajeMensual: mensaje, envios: resultados };
  }

  private construirMensajeResumen(
    ranking: any,
    caja: any,
    mes: number,
    anio: number,
  ) {
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

  private async enviarMensaje(
    numero: string,
    mensaje: string,
    config: ConfiguracionWhatsApp,
  ): Promise<any> {
    // Normalizar número (agregar código de país si no lo tiene)
    let numeroFormato = numero.replace(/\D/g, '');
    if (!numeroFormato.startsWith('51')) {
      numeroFormato = '51' + numeroFormato;
    }

    switch (config.proveedorAPI) {
      case 'twilio':
        return this.enviarPorTwilio(numeroFormato, mensaje, config);
      case 'whatsapp_business':
        return this.enviarPorWhatsAppBusiness(numeroFormato, mensaje, config);
      case 'custom_api':
        return this.enviarPorCustomApi(numeroFormato, mensaje, config);
      case 'dummy':
      default:
        return this.enviarPorDummy(numeroFormato, mensaje, config);
    }
  }

  private async enviarPorTwilio(
    numero: string,
    mensaje: string,
    config: ConfiguracionWhatsApp,
  ) {
    console.log(
      `[TWILIO] Enviando a +${numero} desde ${config.numeroNegocio}: ${mensaje}`,
    );
    return { status: 'enviado_twilio', numero };
  }

  private async enviarPorWhatsAppBusiness(
    numero: string,
    mensaje: string,
    config: ConfiguracionWhatsApp,
  ) {
    console.log(
      `[WHATSAPP_BUSINESS] Enviando a +${numero} desde ${config.numeroNegocio}: ${mensaje}`,
    );
    return { status: 'enviado_whatsapp', numero };
  }

  private async enviarPorCustomApi(
    numero: string,
    mensaje: string,
    config: ConfiguracionWhatsApp,
  ) {
    if (!config.whatsappApiUrl) {
      throw new BadRequestException(
        'URL de la API Custom de WhatsApp no configurada',
      );
    }

    let targetUrl = config.whatsappApiUrl.trim();
    if (!targetUrl.includes('/api/')) {
      if (!targetUrl.endsWith('/')) {
        targetUrl += '/';
      }
      targetUrl += 'api/sendText';
    }

    // wazend expects chatId as number@c.us
    const cleanNumber = numero.replace(/\D/g, '');
    const chatId = `${cleanNumber}@c.us`;

    const payload = {
      session: config.numeroNegocio, // Usamos el campo número negocio para almacenar el ID de sesión
      chatId: chatId,
      to: chatId,
      phone: cleanNumber,
      text: mensaje,
      message: mensaje,
      body: mensaje,
      token: config.whatsappToken,
      apiKey: config.whatsappToken,
      key: config.whatsappToken,
    };

    console.log(
      `[CUSTOM_API] Enviando mensaje a ${chatId} (Sesión: ${config.numeroNegocio}) vía POST ${targetUrl}`,
    );

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (targetUrl.includes('wazend') || targetUrl.includes('evolution')) {
      headers['X-Api-Key'] = config.whatsappToken;
    } else {
      headers['Authorization'] = `Bearer ${config.whatsappToken}`;
      headers['X-Api-Key'] = config.whatsappToken;
      headers['X-API-Key'] = config.whatsappToken;
      headers['apikey'] = config.whatsappToken;
      headers['x-auth-token'] = config.whatsappToken;
    }

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log(
        `[CUSTOM_API Response] Status: ${response.status}. Response: ${responseText}`,
      );

      if (!response.ok) {
        throw new Error(
          `Error en API Custom (${response.status}): ${responseText}`,
        );
      }

      return { status: 'enviado_custom_api', numero, response: responseText };
    } catch (error: any) {
      console.error(`[CUSTOM_API Error] Falló el envío a +${numero}:`, error);
      throw new Error(`Error al enviar por API Custom: ${error.message}`);
    }
  }

  private async enviarPorDummy(
    numero: string,
    mensaje: string,
    config: ConfiguracionWhatsApp,
  ) {
    console.log(`[DUMMY] Mensajes WhatsApp a +${numero}:\n${mensaje}`);
    return { status: 'simulado', numero, mensaje };
  }

  private getNombreMes(mes: number): string {
    const meses = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    return meses[mes - 1];
  }
}
