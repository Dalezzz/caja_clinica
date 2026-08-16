import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

export interface ComprobanteDataForPDF {
  numeroComprobante: number;
  medicoNombre: string;
  medicoEspecialidad: string;
  periodoInicio: string;
  periodoFin: string;
  montoTotal: number;
  montoDescuento: number;
  montoNeto: number;
  cantidadServicios: number;
  tickets: Array<{
    numeroTicket: string;
    paciente: string;
    tarifa: string;
    monto: number;
    comisionMedico: number;
  }>;
  firmaDigital?: string; // Base64
  fechaGeneracion: string;
  clinicaNombre?: string;
  clinicaRuc?: string;
  clinicaDireccion?: string;
}

@Injectable()
export class PdfGeneratorService {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads', 'comprobantes');

  constructor() {
    // Crear directorio si no existe
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async generarComprobantePDF(data: ComprobanteDataForPDF): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const filename = `comprobante_${data.numeroComprobante}_${Date.now()}.pdf`;
        const filePath = path.join(this.uploadsDir, filename);

        const doc = new PDFDocument({
          size: 'A4',
          margin: 40,
        });

        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        // Encabezado
        doc.fontSize(16).font('Helvetica-Bold').text('COMPROBANTE DE PAGO', { align: 'center' });
        doc.fontSize(10).font('Helvetica').text(data.clinicaNombre || 'CAJA CLÍNICA', { align: 'center' });

        if (data.clinicaRuc) {
          doc.fontSize(9).text(`RUC: ${data.clinicaRuc}`, { align: 'center' });
        }

        doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
        doc.moveDown(0.5);

        // Información del Comprobante
        doc.fontSize(10).font('Helvetica-Bold').text('DATOS DEL COMPROBANTE', { underline: true });
        doc.fontSize(9).font('Helvetica');
        doc.text(`Número: ${data.numeroComprobante}`, { width: 250 });
        doc.text(`Fecha: ${new Date(data.fechaGeneracion).toLocaleDateString('es-PE')}`, { width: 250 });
        doc.moveDown(0.3);

        // Información del Médico
        doc.fontSize(10).font('Helvetica-Bold').text('DATOS DEL MÉDICO', { underline: true });
        doc.fontSize(9).font('Helvetica');
        doc.text(`Nombre: ${data.medicoNombre}`, { width: 250 });
        doc.text(`Especialidad: ${data.medicoEspecialidad}`, { width: 250 });
        doc.moveDown(0.3);

        // Período de Servicios
        doc.fontSize(10).font('Helvetica-Bold').text('PERÍODO DE SERVICIOS', { underline: true });
        doc.fontSize(9).font('Helvetica');
        const fechaInicio = new Date(data.periodoInicio).toLocaleDateString('es-PE');
        const fechaFin = new Date(data.periodoFin).toLocaleDateString('es-PE');
        doc.text(`Desde: ${fechaInicio}`, { width: 250 });
        doc.text(`Hasta: ${fechaFin}`, { width: 250 });
        doc.text(`Cantidad de Servicios: ${data.cantidadServicios}`, { width: 250 });
        doc.moveDown(0.5);

        // Tabla de Servicios
        doc.fontSize(10).font('Helvetica-Bold').text('DETALLE DE SERVICIOS', { underline: true });
        this.dibujarTablaServicios(doc, data.tickets);
        doc.moveDown(0.3);

        // Totales
        doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
        this.dibujarTotales(doc, data);

        // Firma Digital
        if (data.firmaDigital) {
          doc.moveDown(0.5);
          doc.fontSize(10).font('Helvetica-Bold').text('FIRMA DEL MÉDICO', { underline: true });
          doc.moveDown(0.2);

          const base64Data = data.firmaDigital.replace(/^data:image\/\w+;base64,/, '');
          const imageBuffer = Buffer.from(base64Data, 'base64');

          try {
            doc.image(imageBuffer, 50, doc.y, { width: 150, height: 100 });
            doc.moveDown(6);
          } catch (error) {
            doc.fontSize(9).text('[Firma digital]');
          }
        }

        // Pie de página
        doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
        doc.moveDown(0.3);
        doc.fontSize(8).font('Helvetica').text(
          'Este comprobante certifica el pago realizado por los servicios médicos prestados. ' +
          'Válido con firma digital del médico.',
          { align: 'center', width: 515 },
        );
        doc.text(
          `Generado: ${new Date().toLocaleString('es-PE')}`,
          { align: 'center' },
        );

        doc.end();

        writeStream.on('finish', () => {
          resolve(filePath);
        });

        writeStream.on('error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private dibujarTablaServicios(doc: any, tickets: any[]): void {
    const tableTop = doc.y;
    const colWidth = 125;
    const rowHeight = 20;
    let yPosition = tableTop + 15;

    // Headers
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Ticket', 50, tableTop, { width: colWidth });
    doc.text('Paciente', 175, tableTop, { width: colWidth });
    doc.text('Tarifa', 300, tableTop, { width: 100 });
    doc.text('Monto', 420, tableTop, { width: colWidth, align: 'right' });
    doc.text('Comisión', 490, tableTop, { width: colWidth, align: 'right' });

    doc.moveTo(50, tableTop + 12).lineTo(555, tableTop + 12).stroke();

    // Datos
    doc.font('Helvetica').fontSize(8);
    let totalMonto = 0;
    let totalComision = 0;

    tickets.forEach((ticket) => {
      doc.text(ticket.numeroTicket, 50, yPosition, { width: colWidth });
      doc.text(ticket.paciente.substring(0, 20), 175, yPosition, { width: colWidth });
      doc.text(ticket.tarifa.substring(0, 15), 300, yPosition, { width: 100 });
      doc.text(ticket.monto.toFixed(2), 420, yPosition, { width: colWidth, align: 'right' });
      doc.text(ticket.comisionMedico.toFixed(2), 490, yPosition, { width: colWidth, align: 'right' });

      totalMonto += ticket.monto;
      totalComision += ticket.comisionMedico;
      yPosition += rowHeight;
    });

    doc.moveTo(50, yPosition).lineTo(555, yPosition).stroke();
  }

  private dibujarTotales(doc: any, data: ComprobanteDataForPDF): void {
    const startY = doc.y + 10;

    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Monto Total de Servicios:', 300, startY, { width: 120 });
    doc.text(`S/ ${data.montoTotal.toFixed(2)}`, 420, startY, { width: 135, align: 'right' });

    let currentY = startY + 20;

    if (data.montoDescuento > 0) {
      doc.text('Descuento Aplicado:', 300, currentY, { width: 120 });
      doc.text(`-S/ ${data.montoDescuento.toFixed(2)}`, 420, currentY, { width: 135, align: 'right' });
      currentY += 20;
    }

    doc.moveTo(300, currentY).lineTo(555, currentY).stroke();
    currentY += 10;

    doc.fontSize(12).font('Helvetica-Bold').text('MONTO NETO A PAGAR:', 300, currentY, { width: 120 });
    doc.text(`S/ ${data.montoNeto.toFixed(2)}`, 420, currentY, { width: 135, align: 'right' });

    doc.moveDown(3);
  }

  obtenerRutaComprobante(filename: string): string {
    return path.join(this.uploadsDir, filename);
  }

  existeComprobante(filename: string): boolean {
    return fs.existsSync(this.obtenerRutaComprobante(filename));
  }

  eliminarComprobante(filename: string): void {
    const filePath = this.obtenerRutaComprobante(filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  obtenerStreamComprobante(filename: string): fs.ReadStream {
    return fs.createReadStream(this.obtenerRutaComprobante(filename));
  }
}
