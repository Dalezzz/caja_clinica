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

// Dimensiones A4 con margen 50
const MARGIN = 50;
const PAGE_WIDTH = 595.28;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

@Injectable()
export class PdfGeneratorService {
  private readonly uploadsDir = path.join(
    process.cwd(),
    'uploads',
    'comprobantes',
  );

  constructor() {
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
          margin: MARGIN,
          autoFirstPage: true,
        });
        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        this.dibujarEncabezado(doc, data);
        this.dibujarInfoGrid(doc, data);
        this.dibujarTablaServicios(doc, data.tickets);
        this.dibujarTotales(doc, data);
        this.dibujarFirma(doc, data);
        this.dibujarPiePagina(doc);

        doc.end();
        writeStream.on('finish', () => resolve(filePath));
        writeStream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  // ─── ENCABEZADO ────────────────────────────────────────────────────────────
  private dibujarEncabezado(doc: any, data: ComprobanteDataForPDF): void {
    const clinica = (data.clinicaNombre || 'Centro Médico Medic').toUpperCase();

    // Barra verde superior
    doc.rect(MARGIN, MARGIN, CONTENT_WIDTH, 6).fill('#059669');

    let y = MARGIN + 20;

    // Título
    doc
      .font('Helvetica-Bold')
      .fontSize(18)
      .fillColor('#111827')
      .text('COMPROBANTE DE PAGO MÉDICO', MARGIN, y, {
        align: 'center',
        width: CONTENT_WIDTH,
      });
    y = doc.y + 2;

    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#6b7280')
      .text(clinica, MARGIN, y, { align: 'center', width: CONTENT_WIDTH });

    if (data.clinicaRuc) {
      y = doc.y + 1;
      doc
        .fontSize(9)
        .text(`RUC: ${data.clinicaRuc}`, MARGIN, y, {
          align: 'center',
          width: CONTENT_WIDTH,
        });
    }

    y = doc.y + 8;
    // Línea divisoria
    doc
      .moveTo(MARGIN, y)
      .lineTo(PAGE_WIDTH - MARGIN, y)
      .lineWidth(0.5)
      .strokeColor('#d1d5db')
      .stroke();
    doc.y = y + 10;
  }

  // ─── GRID DE INFORMACIÓN ───────────────────────────────────────────────────
  private dibujarInfoGrid(doc: any, data: ComprobanteDataForPDF): void {
    const y = doc.y;
    const colA = MARGIN;
    const colB = MARGIN + CONTENT_WIDTH / 2 + 10;
    const colW = CONTENT_WIDTH / 2 - 10;

    // Caja izquierda: Comprobante + Médico
    this.dibujarSeccionInfo(
      doc,
      'DATOS DEL COMPROBANTE',
      [
        {
          label: 'Número',
          value: `#${String(data.numeroComprobante).padStart(4, '0')}`,
        },
        {
          label: 'Fecha de emisión',
          value: new Date(data.fechaGeneracion).toLocaleDateString('es-PE', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          }),
        },
      ],
      colA,
      y,
      colW,
    );

    // Caja derecha: Período
    this.dibujarSeccionInfo(
      doc,
      'PERÍODO DE SERVICIOS',
      [
        {
          label: 'Desde',
          value: new Date(data.periodoInicio).toLocaleDateString('es-PE'),
        },
        {
          label: 'Hasta',
          value: new Date(data.periodoFin).toLocaleDateString('es-PE'),
        },
        { label: 'Servicios', value: `${data.cantidadServicios}` },
      ],
      colB,
      y,
      colW,
    );

    const newY = doc.y + 8;

    // Caja completa: Médico
    this.dibujarSeccionInfo(
      doc,
      'DATOS DEL MÉDICO',
      [
        { label: 'Nombre', value: data.medicoNombre },
        { label: 'Especialidad', value: data.medicoEspecialidad || '—' },
      ],
      colA,
      newY,
      CONTENT_WIDTH,
    );

    doc.y = doc.y + 10;
  }

  private dibujarSeccionInfo(
    doc: any,
    titulo: string,
    campos: { label: string; value: string }[],
    x: number,
    y: number,
    width: number,
  ): void {
    // Título de sección
    doc
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .fillColor('#059669')
      .text(titulo, x, y, { width, characterSpacing: 0.5 });
    let rowY = doc.y + 3;

    // Línea bajo título
    doc
      .moveTo(x, rowY)
      .lineTo(x + width, rowY)
      .lineWidth(0.3)
      .strokeColor('#d1d5db')
      .stroke();
    rowY += 5;

    campos.forEach(({ label, value }) => {
      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor('#374151')
        .text(`${label}:`, x, rowY, { width: 90, continued: false });
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#111827')
        .text(value, x + 92, rowY, { width: width - 92 });
      rowY = doc.y + 1;
    });

    doc.y = rowY;
  }

  // ─── TABLA DE SERVICIOS ────────────────────────────────────────────────────
  private dibujarTablaServicios(
    doc: any,
    tickets: ComprobanteDataForPDF['tickets'],
  ): void {
    const tableY = doc.y + 4;

    // Título
    doc
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .fillColor('#059669')
      .text('DETALLE DE SERVICIOS', MARGIN, tableY, { characterSpacing: 0.5 });

    const headerY = doc.y + 4;
    const rowH = 18;

    // Columnas: Ticket | Paciente | Tarifa | Monto | Comisión Médico
    const cols = {
      ticket: { x: MARGIN, w: 110 },
      paciente: { x: MARGIN + 112, w: 130 },
      tarifa: { x: MARGIN + 245, w: 120 },
      monto: { x: MARGIN + 368, w: 60 },
      comision: { x: MARGIN + 431, w: 64 },
    };
    const tableRight = cols.comision.x + cols.comision.w;

    // Fondo header
    doc.rect(MARGIN, headerY, CONTENT_WIDTH, rowH).fill('#f3f4f6');

    // Textos header
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#374151');
    doc.text('Ticket', cols.ticket.x + 4, headerY + 5, {
      width: cols.ticket.w,
    });
    doc.text('Paciente', cols.paciente.x + 4, headerY + 5, {
      width: cols.paciente.w,
    });
    doc.text('Servicio/Tarifa', cols.tarifa.x + 4, headerY + 5, {
      width: cols.tarifa.w,
    });
    doc.text('Monto', cols.monto.x, headerY + 5, {
      width: cols.monto.w,
      align: 'right',
    });
    doc.text('Comisión', cols.comision.x, headerY + 5, {
      width: cols.comision.w,
      align: 'right',
    });

    // Borde inferior del header
    let rowY = headerY + rowH;
    doc
      .moveTo(MARGIN, rowY)
      .lineTo(tableRight, rowY)
      .lineWidth(0.5)
      .strokeColor('#9ca3af')
      .stroke();

    // Filas
    doc.font('Helvetica').fontSize(8).fillColor('#111827');
    let totalMonto = 0;
    let totalComision = 0;

    tickets.forEach((t, i) => {
      // Alternating row background
      if (i % 2 === 0) {
        doc.rect(MARGIN, rowY, CONTENT_WIDTH, rowH).fill('#fafafa');
      }

      doc.fillColor('#111827');
      doc.text(t.numeroTicket, cols.ticket.x + 4, rowY + 5, {
        width: cols.ticket.w - 4,
      });
      doc.text(this.truncar(t.paciente, 22), cols.paciente.x + 4, rowY + 5, {
        width: cols.paciente.w - 4,
      });
      doc.text(this.truncar(t.tarifa, 20), cols.tarifa.x + 4, rowY + 5, {
        width: cols.tarifa.w - 4,
      });
      doc.text(`S/ ${t.monto.toFixed(2)}`, cols.monto.x, rowY + 5, {
        width: cols.monto.w,
        align: 'right',
      });
      doc.text(`S/ ${t.comisionMedico.toFixed(2)}`, cols.comision.x, rowY + 5, {
        width: cols.comision.w,
        align: 'right',
      });

      totalMonto += t.monto;
      totalComision += t.comisionMedico;
      rowY += rowH;
    });

    // Borde inferior tabla
    doc
      .moveTo(MARGIN, rowY)
      .lineTo(tableRight, rowY)
      .lineWidth(0.5)
      .strokeColor('#9ca3af')
      .stroke();

    // Fila SUBTOTALES de la tabla
    rowY += 4;
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#374151');
    doc.text('Totales:', cols.tarifa.x + 4, rowY, { width: cols.tarifa.w });
    doc.text(`S/ ${totalMonto.toFixed(2)}`, cols.monto.x, rowY, {
      width: cols.monto.w,
      align: 'right',
    });
    doc.text(`S/ ${totalComision.toFixed(2)}`, cols.comision.x, rowY, {
      width: cols.comision.w,
      align: 'right',
    });

    doc.y = rowY + 18;
  }

  // ─── TOTALES ───────────────────────────────────────────────────────────────
  private dibujarTotales(doc: any, data: ComprobanteDataForPDF): void {
    const y = doc.y + 4;
    // Línea separadora
    doc
      .moveTo(MARGIN, y)
      .lineTo(PAGE_WIDTH - MARGIN, y)
      .lineWidth(0.5)
      .strokeColor('#d1d5db')
      .stroke();

    const boxX = MARGIN + CONTENT_WIDTH * 0.45;
    const boxW = CONTENT_WIDTH * 0.55;
    let rowY = y + 10;
    const labelW = 160;
    const valueX = boxX + labelW;
    const valueW = boxW - labelW;

    // Monto total
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#374151')
      .text('Total de Servicios:', boxX, rowY, { width: labelW });
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor('#111827')
      .text(`S/ ${data.montoTotal.toFixed(2)}`, valueX, rowY, {
        width: valueW,
        align: 'right',
      });
    rowY += 16;

    // Descuento (si aplica)
    if (data.montoDescuento > 0) {
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#dc2626')
        .text('Descuento:', boxX, rowY, { width: labelW });
      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor('#dc2626')
        .text(`-S/ ${data.montoDescuento.toFixed(2)}`, valueX, rowY, {
          width: valueW,
          align: 'right',
        });
      rowY += 16;
    }

    // Línea antes del neto
    doc
      .moveTo(boxX, rowY)
      .lineTo(PAGE_WIDTH - MARGIN, rowY)
      .lineWidth(0.5)
      .strokeColor('#d1d5db')
      .stroke();
    rowY += 8;

    // MONTO NETO — destacado con fondo verde
    doc.rect(boxX - 6, rowY - 4, boxW + 6, 26).fill('#ecfdf5');
    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#065f46')
      .text('MONTO NETO A PAGAR:', boxX, rowY, { width: labelW });
    doc
      .font('Helvetica-Bold')
      .fontSize(13)
      .fillColor('#059669')
      .text(`S/ ${data.montoNeto.toFixed(2)}`, valueX, rowY - 1, {
        width: valueW,
        align: 'right',
      });

    doc.y = rowY + 32;
  }

  // ─── FIRMA DIGITAL ─────────────────────────────────────────────────────────
  private dibujarFirma(doc: any, data: ComprobanteDataForPDF): void {
    const y = doc.y + 8;

    // Línea separadora
    doc
      .moveTo(MARGIN, y)
      .lineTo(PAGE_WIDTH - MARGIN, y)
      .lineWidth(0.5)
      .strokeColor('#d1d5db')
      .stroke();
    let sigY = y + 10;

    doc
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .fillColor('#374151')
      .text('FIRMA Y CONFORMIDAD DEL MÉDICO', MARGIN, sigY, {
        width: CONTENT_WIDTH,
        align: 'center',
      });
    sigY = doc.y + 6;

    if (data.firmaDigital) {
      try {
        const base64Data = data.firmaDigital.replace(
          /^data:image\/\w+;base64,/,
          '',
        );
        const imageBuffer = Buffer.from(base64Data, 'base64');
        const sigX = PAGE_WIDTH / 2 - 80;
        // Fondo para la firma
        doc
          .rect(sigX - 5, sigY - 5, 170, 80)
          .fill('#f9fafb')
          .stroke();
        doc.image(imageBuffer, sigX, sigY, { width: 160, height: 70 });
        sigY += 80;
      } catch {
        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#9ca3af')
          .text('[Firma digital registrada]', MARGIN, sigY, {
            width: CONTENT_WIDTH,
            align: 'center',
          });
        sigY = doc.y;
      }
    } else {
      // Línea de firma en blanco
      const lineX = PAGE_WIDTH / 2 - 80;
      doc
        .moveTo(lineX, sigY + 50)
        .lineTo(lineX + 160, sigY + 50)
        .lineWidth(0.5)
        .strokeColor('#6b7280')
        .stroke();
      sigY += 60;
    }

    // Nombre del médico bajo firma
    doc
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .fillColor('#111827')
      .text(data.medicoNombre, MARGIN, sigY + 4, {
        width: CONTENT_WIDTH,
        align: 'center',
      });
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#6b7280')
      .text(data.medicoEspecialidad || '', MARGIN, doc.y + 1, {
        width: CONTENT_WIDTH,
        align: 'center',
      });

    doc.y = doc.y + 14;
  }

  // ─── PIE DE PÁGINA ─────────────────────────────────────────────────────────
  private dibujarPiePagina(doc: any): void {
    const y = doc.y + 6;
    doc
      .moveTo(MARGIN, y)
      .lineTo(PAGE_WIDTH - MARGIN, y)
      .lineWidth(0.5)
      .strokeColor('#d1d5db')
      .stroke();
    const footerY = y + 6;

    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor('#9ca3af')
      .text(
        'Este comprobante certifica el pago de servicios médicos. Documento generado electrónicamente — válido con firma digital.',
        MARGIN,
        footerY,
        { align: 'center', width: CONTENT_WIDTH },
      );
    doc.text(
      `Generado el: ${new Date().toLocaleString('es-PE')}`,
      MARGIN,
      doc.y + 2,
      { align: 'center', width: CONTENT_WIDTH },
    );

    // Barra verde inferior
    const pageHeight = 841.89;
    doc.rect(MARGIN, pageHeight - MARGIN - 4, CONTENT_WIDTH, 4).fill('#059669');
  }

  // ─── UTILIDADES ────────────────────────────────────────────────────────────
  private truncar(str: string, max: number): string {
    if (!str) return '—';
    return str.length > max ? str.substring(0, max - 1) + '…' : str;
  }

  obtenerRutaComprobante(filename: string): string {
    return path.join(this.uploadsDir, filename);
  }

  existeComprobante(filename: string): boolean {
    return fs.existsSync(this.obtenerRutaComprobante(filename));
  }

  eliminarComprobante(filename: string): void {
    const filePath = this.obtenerRutaComprobante(filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  obtenerStreamComprobante(filename: string): fs.ReadStream {
    return fs.createReadStream(this.obtenerRutaComprobante(filename));
  }
}
