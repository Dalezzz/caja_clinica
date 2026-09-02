import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import makeWASocket, { useMultiFileAuthState, DisconnectReason, WASocket } from '@whiskeysockets/baileys';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class WhatsappService implements OnModuleInit, OnModuleDestroy {
  private sock: WASocket | null = null;
  private readonly logger = new Logger(WhatsappService.name);
  
  private connectionStatus: 'disconnected' | 'connecting' | 'qr' | 'connected' = 'disconnected';
  private currentQrCode: string | null = null;
  
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    // Only connect if enabled in DB
    const ajustes = await this.prisma.ajustes.findFirst();
    if (ajustes?.whatsappEnabled) {
      this.connectToWhatsApp();
    } else {
      this.logger.log('WhatsApp Bot is disabled in settings.');
    }
  }

  onModuleDestroy() {
    this.logger.log('Destroying WhatsappService, closing socket connection...');
    if (this.sock) {
      try {
        this.sock.ev.removeAllListeners('connection.update');
        this.sock.ev.removeAllListeners('creds.update');
        this.sock.ev.removeAllListeners('messages.upsert');
        this.sock.end(undefined);
        this.sock = null;
      } catch (err) {
        // ignore
      }
    }
  }

  async connectToWhatsApp() {
    if (this.connectionStatus === 'connected' || this.connectionStatus === 'connecting') return;
    
    this.connectionStatus = 'connecting';
    this.logger.log('Initializing WhatsApp connection...');

    if (this.sock) {
      this.sock.ev.removeAllListeners('connection.update');
      this.sock.ev.removeAllListeners('creds.update');
      this.sock.ev.removeAllListeners('messages.upsert');
      this.sock = null;
    }

    const authFolder = path.join(process.cwd(), 'whatsapp_auth');
    const { state, saveCreds } = await useMultiFileAuthState(authFolder);

    this.sock = makeWASocket({
      auth: state,
      printQRInTerminal: true, // Also print in terminal for convenience
      logger: require('pino')({ level: 'silent' }) // Silence noisy logs
    });

    this.sock.ev.on('creds.update', saveCreds);

    this.sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        this.connectionStatus = 'qr';
        this.currentQrCode = await QRCode.toDataURL(qr);
        this.logger.log('QR Code generated. Please scan it.');
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        
        this.logger.warn(`Connection closed (Code: ${statusCode}). Reconnecting: ${shouldReconnect}`);
        
        if (shouldReconnect) {
          this.connectionStatus = 'disconnected';
          this.logger.log('Reconnecting in 3 seconds...');
          setTimeout(() => this.connectToWhatsApp(), 3000);
        } else {
          this.connectionStatus = 'disconnected';
          this.currentQrCode = null;
          this.sock = null;
          this.logger.log('Session closed by user. Restart auth.');
          // Optional: clear auth folder
          fs.rmSync(authFolder, { recursive: true, force: true });
        }
      } else if (connection === 'open') {
        this.connectionStatus = 'connected';
        this.currentQrCode = null;
        this.logger.log('✅ Bot successfully connected to WhatsApp.');
      }
    });

    this.sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;
      const msg = messages[0];
      if (!msg.message || msg.key.fromMe) return;

      const body = msg.message.conversation || msg.message.extendedTextMessage?.text;
      if (!body) return;

      const command = body.trim().toLowerCase();
      if (command === '!reporte' || command === '!avance') {
        const isAuthorized = await this.isAuthorized(msg.key.remoteJid!);
        if (isAuthorized) {
          const report = await this.generateReport();
          await this.sendMessage(msg.key.remoteJid!, report);
        }
      }
    });
  }

  async logout() {
    if (this.sock) {
      this.sock.logout();
    }
    const authFolder = path.join(process.cwd(), 'whatsapp_auth');
    if (fs.existsSync(authFolder)) {
      fs.rmSync(authFolder, { recursive: true, force: true });
    }
    this.connectionStatus = 'disconnected';
    this.currentQrCode = null;
    this.sock = null;
  }

  getStatus() {
    return {
      status: this.connectionStatus,
      qr: this.currentQrCode,
    };
  }

  async sendMessage(jid: string, text: string) {
    if (!this.sock || this.connectionStatus !== 'connected') {
      this.logger.error('Cannot send message: WhatsApp is not connected.');
      return;
    }
    try {
      await this.sock.sendMessage(jid, { text });
    } catch (err) {
      this.logger.error('Error sending message:', err);
    }
  }

  private async isAuthorized(jid: string): Promise<boolean> {
    const ajustes = await this.prisma.ajustes.findFirst();
    if (!ajustes || !ajustes.whatsappGerentes) return false;
    
    // Gerentes are comma separated
    const gerentes = ajustes.whatsappGerentes.split(',').map(g => g.trim().replace('+', ''));
    const senderNumber = jid.split('@')[0];
    
    return gerentes.includes(senderNumber);
  }

  private async generateReport(): Promise<string> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Tickets del día
    const tickets = await this.prisma.ticket.findMany({
      where: {
        fecha: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      include: {
        tarifa: true,
      }
    });

    const totalCitas = tickets.length;
    const completadas = tickets.filter(t => t.estado === 'ACTIVO').length;
    const canceladas = tickets.filter(t => t.estado === 'ANULADO').length;
    const recaudado = tickets.filter(t => t.estado === 'ACTIVO').reduce((sum, t) => sum + Number(t.montoClinica), 0);

    const hoyStr = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });

    return `📊 *REPORTE MÉDICO DIARIO*\n` +
           `📅 *Fecha:* ${hoyStr}\n` +
           `━━━━━━━━━━━━━━━━━━━━\n` +
           `🩺 *Atenciones completadas:* ${completadas} / ${totalCitas}\n` +
           `❌ *Cancelaciones / Anulados:* ${canceladas}\n` +
           `💰 *Ingresos de la Clínica:* S/ ${recaudado.toFixed(2)}\n` +
           `━━━━━━━━━━━━━━━━━━━━\n` +
           `_Reporte generado de forma automática._`;
  }

  // Cron job checks every minute if it's time to send the report
  @Cron('* * * * *')
  async handleCron() {
    const ajustes = await this.prisma.ajustes.findFirst();
    if (!ajustes?.whatsappEnabled || !ajustes?.whatsappCronTime || !ajustes?.whatsappGerentes) return;
    
    if (this.connectionStatus !== 'connected' || !this.sock) return;

    const now = new Date();
    const currentHour = now.getHours().toString().padStart(2, '0');
    const currentMinute = now.getMinutes().toString().padStart(2, '0');
    const currentTimeStr = `${currentHour}:${currentMinute}`;
    
    // Check frequency logic
    let shouldSend = false;
    
    // Check if we already sent it today
    const ultimoEnvio = ajustes.whatsappUltimoEnvio;
    const isSentToday = ultimoEnvio && 
                        ultimoEnvio.getDate() === now.getDate() &&
                        ultimoEnvio.getMonth() === now.getMonth() &&
                        ultimoEnvio.getFullYear() === now.getFullYear();

    if (!isSentToday && currentTimeStr === ajustes.whatsappCronTime) {
      if (ajustes.whatsappFrecuencia === 'diario') {
        shouldSend = true;
      } else if (ajustes.whatsappFrecuencia === 'semanal' && now.getDay() === 5) { // Viernes por defecto
        shouldSend = true;
      } else if (ajustes.whatsappFrecuencia === 'mensual' && now.getDate() === 1) { // Día 1 de mes
        shouldSend = true;
      }
    }

    if (shouldSend) {
      this.logger.log('Time to send automatic report...');
      try {
        const reportText = await this.generateReport();
        const gerentes = ajustes.whatsappGerentes.split(',').map(g => g.trim().replace('+', ''));
        
        for (const g of gerentes) {
          if (g) {
             const jid = `${g}@s.whatsapp.net`;
             await this.sendMessage(jid, reportText);
          }
        }
        
        await this.prisma.ajustes.update({
          where: { id: 1 },
          data: { whatsappUltimoEnvio: new Date() }
        });
        
        this.logger.log('Automatic report sent successfully.');
      } catch (err) {
        this.logger.error('Error sending automatic report in cron:', err);
      }
    }
  }

  async checkMissedReports(): Promise<{ missed: boolean; message: string }> {
    const ajustes = await this.prisma.ajustes.findFirst();
    if (!ajustes?.whatsappEnabled) return { missed: false, message: '' };

    const now = new Date();
    const ultimoEnvio = ajustes.whatsappUltimoEnvio;
    
    if (!ultimoEnvio) return { missed: false, message: '' };

    const diffTime = Math.abs(now.getTime() - ultimoEnvio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (ajustes.whatsappFrecuencia === 'diario' && diffDays > 1) {
      return { missed: true, message: 'No se enviaron los reportes de los últimos días (sistema apagado).' };
    }
    return { missed: false, message: '' };
  }

  async triggerMissedReport() {
    this.logger.log('Manually triggering missed report...');
    const ajustes = await this.prisma.ajustes.findFirst();
    if (!ajustes?.whatsappGerentes) return;

    const reportText = await this.generateReport();
    const gerentes = ajustes.whatsappGerentes.split(',').map(g => g.trim().replace('+', ''));
    
    for (const g of gerentes) {
      if (g) {
         const jid = `${g}@s.whatsapp.net`;
         await this.sendMessage(jid, reportText);
      }
    }
    
    await this.prisma.ajustes.update({
      where: { id: 1 },
      data: { whatsappUltimoEnvio: new Date() }
    });
  }
}
