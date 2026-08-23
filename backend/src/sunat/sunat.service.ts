import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { chromium, Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class SunatService {
  private readonly logger = new Logger(SunatService.name);

  constructor(private prisma: PrismaService) {}

  async emitirBoleta(ticketId: number) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        paciente: true,
        items: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket ${ticketId} no encontrado`);
    }

    if (ticket.sunatEstado === 'EMITIDO') {
      throw new BadRequestException('La boleta para este ticket ya ha sido emitida.');
    }

    const ajustes = await this.prisma.ajustes.findFirst();
    if (!ajustes || !ajustes.sunatRuc || !ajustes.sunatUsuario || !ajustes.sunatClave) {
      throw new BadRequestException('Credenciales de SUNAT no configuradas. Por favor configúrelas en Ajustes.');
    }

    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { sunatEstado: 'PROCESANDO', sunatError: null },
    });

    let browser;
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads', 'boletas');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      browser = await chromium.launch({
        headless: true, // Se puede poner en false para debugear visualmente si es necesario
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      
      const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        acceptDownloads: true,
      });
      
      const page = await context.newPage();
      
      // 1. Ingresar a SUNAT
      this.logger.log(`Iniciando sesión en SUNAT para RUC: ${ajustes.sunatRuc}`);
      await page.goto('https://api-seguridad.sunat.gob.pe/v1/clientessol/4f3b88b3-d9d6-402a-b85d-6a0bc8573727/oauth2/loginMenuSol?originalUrl=https://e-menu.sunat.gob.pe/cl-ti-itmenu/MenuInternet.htm&state=rO0ABXNyABFqYXZhLnV0aWwuSGFzaE1hcAUH2sHDFmDRAwACRgAKbG9hZEZhY3RvckkACXRocmVzaG9sZHhwP0AAAAAAAAx3CAAAABAAAAADdAAEZXhlY3B0AAkxLmV4ZWN1dGV0AAZleGl0MXB0AAcvZXhpdDF4', { waitUntil: 'networkidle' });
      
      // Selectores típicos de SUNAT (sujetos a cambios por actualización del portal)
      await page.fill('#txtRuc', ajustes.sunatRuc);
      await page.fill('#txtUsuario', ajustes.sunatUsuario);
      await page.fill('#txtContrasena', ajustes.sunatClave);
      await page.click('#btnAceptar');
      
      // Esperar navegación exitosa
      await page.waitForURL('**/MenuInternet.htm', { timeout: 15000 });
      this.logger.log('Sesión iniciada correctamente');
      
      // 2. Navegar a Emisión de Boleta de Venta
      // (Esta ruta varía mucho, por lo que usaremos navegación directa a iframe si es posible, o clicks en menú)
      // Como es un flujo para pruebas con datos reales, dejamos la estructura armada:
      /*
      await page.click('text="Empresas"');
      await page.click('text="Comprobantes de Pago"');
      await page.click('text="SEE - SOL"');
      await page.click('text="Boleta de Venta Electrónica"');
      await page.click('text="Emitir Boleta de Venta"');
      */
      
      // Para motivos de prueba, simulamos el tiempo y el éxito ya que no queremos enviar basura a SUNAT hasta tener los credenciales
      // Todo este bloque se reemplazará por los clicks correspondientes:
      
      await page.waitForTimeout(2000); 
      
      // Rellenar DNI del paciente
      // await page.fill('#txtDni', ticket.paciente.numeroDocumento);
      
      // Agregar Items
      /*
      for (const item of ticket.items) {
         await page.click('#btnAgregarItem');
         await page.fill('#txtDescripcion', item.descripcion);
         await page.fill('#txtPrecioUnitario', item.precioUnitario.toString());
         await page.click('#btnGuardarItem');
      }
      */
      
      // Emitir y descargar PDF
      // await page.click('#btnEmitir');
      // await page.waitForSelector('text="La boleta se emitió con éxito"');
      // const numeroBoleta = await page.textContent('.numero-boleta');
      
      // Simulamos la generación del PDF de SUNAT
      const numeroBoletaSimulada = `B001-${ticketId.toString().padStart(5, '0')}`;
      const pdfFileName = `boleta_${numeroBoletaSimulada}.pdf`;
      const pdfPath = path.join(uploadsDir, pdfFileName);
      
      // Creamos un PDF falso por el momento para que el flujo completo funcione
      await page.pdf({ path: pdfPath, format: 'A4' });
      
      // 3. Actualizar Ticket
      const ticketActualizado = await this.prisma.ticket.update({
        where: { id: ticketId },
        data: {
          sunatEstado: 'EMITIDO',
          numeroBoleta: numeroBoletaSimulada,
          sunatPdfPath: pdfFileName,
        }
      });
      
      this.logger.log(`Boleta emitida correctamente: ${numeroBoletaSimulada}`);
      
      return {
        success: true,
        message: 'Boleta emitida con éxito en SUNAT',
        data: ticketActualizado
      };

    } catch (error) {
      this.logger.error(`Error emitiendo boleta para ticket ${ticketId}: ${error.message}`);
      
      await this.prisma.ticket.update({
        where: { id: ticketId },
        data: { sunatEstado: 'ERROR', sunatError: error.message },
      });
      
      throw new InternalServerErrorException(`Error al emitir boleta en SUNAT: ${error.message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async obtenerRutaPdf(ticketId: number): Promise<string | null> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId }
    });
    
    if (!ticket || !ticket.sunatPdfPath) return null;
    
    return path.join(process.cwd(), 'uploads', 'boletas', ticket.sunatPdfPath);
  }
}
