import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TipoMovimientoKardex } from '@prisma/client';
import { CreateProductoDto } from './dto/create-producto.dto';
import { CreateMovimientoDto } from './dto/create-movimiento.dto';
import * as XLSX from 'xlsx';

@Injectable()
export class FarmaciaService {
  private readonly logger = new Logger(FarmaciaService.name);

  constructor(private prisma: PrismaService) { }

  // ──────────────────────────────────────────────
  // PRODUCTOS
  // ──────────────────────────────────────────────

  async findAllProductos(busqueda?: string, categoria?: string) {
    return this.prisma.producto.findMany({
      where: {
        activo: true,
        ...(busqueda && {
          nombre: { contains: busqueda, mode: 'insensitive' },
        }),
        ...(categoria && { categoria }),
      },
      include: {
        _count: { select: { movimientos: true } },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async findCategorias() {
    const result = await this.prisma.producto.groupBy({
      by: ['categoria'],
      where: { activo: true },
      orderBy: { categoria: 'asc' },
    });
    return result.map((r) => r.categoria);
  }

  async findProductoById(id: number) {
    const producto = await this.prisma.producto.findUnique({
      where: { id },
      include: {
        movimientos: {
          orderBy: { fecha: 'desc' },
          take: 200,
        },
      },
    });
    if (!producto) throw new NotFoundException(`Producto ${id} no encontrado`);
    return producto;
  }

  async createProducto(dto: CreateProductoDto) {
    return this.prisma.$transaction(async (tx) => {
      const producto = await tx.producto.create({
        data: {
          nombre: dto.nombre,
          detalle: dto.detalle,
          categoria: dto.categoria,
          stockActual: dto.stockActual ?? 0,
          unidadMedida: dto.unidadMedida ?? 'UND',
        },
      });

      // Si se crea con stock inicial, registrar un movimiento de ENTRADA
      if (dto.stockActual && dto.stockActual > 0) {
        await tx.movimientoKardex.create({
          data: {
            productoId: producto.id,
            tipo: TipoMovimientoKardex.ENTRADA,
            cantidad: dto.stockActual,
            saldoResultante: dto.stockActual,
            motivo: 'Stock inicial',
          },
        });
      }

      return producto;
    });
  }

  async updateProducto(id: number, data: Partial<CreateProductoDto>) {
    await this.findProductoById(id);
    return this.prisma.producto.update({ where: { id }, data });
  }

  async desactivarProducto(id: number) {
    await this.findProductoById(id);
    return this.prisma.producto.update({
      where: { id },
      data: { activo: false },
    });
  }

  // ──────────────────────────────────────────────
  // MOVIMIENTOS KARDEX
  // ──────────────────────────────────────────────

  async registrarMovimiento(dto: CreateMovimientoDto, ticketId?: number) {
    return this.prisma.$transaction(async (tx) => {
      const producto = await tx.producto.findUnique({
        where: { id: dto.productoId },
      });
      if (!producto) {
        throw new NotFoundException(`Producto ${dto.productoId} no encontrado`);
      }

      const stockActual = Number(producto.stockActual);
      let nuevoStock: number;

      if (dto.tipo === TipoMovimientoKardex.ENTRADA) {
        nuevoStock = stockActual + dto.cantidad;
      } else if (dto.tipo === TipoMovimientoKardex.SALIDA) {
        if (stockActual < dto.cantidad) {
          throw new BadRequestException(
            `Stock insuficiente para "${producto.nombre}". Stock actual: ${stockActual} ${producto.unidadMedida}, solicitado: ${dto.cantidad}`,
          );
        }
        nuevoStock = stockActual - dto.cantidad;
      } else {
        // AJUSTE: sobreescribe el stock
        nuevoStock = dto.cantidad;
      }

      const movimiento = await tx.movimientoKardex.create({
        data: {
          productoId: dto.productoId,
          tipo: dto.tipo,
          cantidad: dto.cantidad,
          saldoResultante: nuevoStock,
          motivo: dto.motivo,
          ticketId: ticketId ?? null,
        },
      });

      await tx.producto.update({
        where: { id: dto.productoId },
        data: { stockActual: nuevoStock },
      });

      return movimiento;
    });
  }

  // ──────────────────────────────────────────────
  // IMPORTADOR EXCEL (Fase 2)
  // ──────────────────────────────────────────────

  async importarDesdeExcel(
    buffer: Buffer,
    contexto: 'clinica' | 'farmacia',
  ): Promise<{ importados: number; productos: number; errores: string[] }> {
    this.logger.log(`Iniciando importación Excel (contexto: ${contexto})`);
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false });

    const errores: string[] = [];
    let productosCreados = 0;
    let movimientosCreados = 0;

    // Separar hojas: "Resumen" vs hojas de productos individuales
    const hojasResumen = workbook.SheetNames.filter((n) =>
      n.toLowerCase().includes('resumen'),
    );
    const hojasProducto = workbook.SheetNames.filter(
      (n) => !n.toLowerCase().includes('resumen'),
    );

    this.logger.log(
      `Hojas encontradas — Resumen: ${hojasResumen.length}, Productos: ${hojasProducto.length}`,
    );

    // Extraer categorías del resumen (si existe)
    const categoriasPorHoja: Record<string, string> = {};
    for (const hojaResumen of hojasResumen) {
      const ws = workbook.Sheets[hojaResumen];
      const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: null });
      for (const row of rows) {
        const hoja = row['Hoja'] ?? row['hoja'] ?? row['HOJA'];
        const cat = row['Categoría'] ?? row['Categoria'] ?? row['categoria'] ?? row['CATEGORIA'];
        if (hoja && cat) categoriasPorHoja[String(hoja).trim()] = String(cat).trim();
      }
    }

    // Procesar cada hoja de producto dentro de una sola transacción
    await this.prisma.$transaction(
      async (tx) => {
        for (const nombreHoja of hojasProducto) {
          const categoria = categoriasPorHoja[nombreHoja] ?? contexto.toUpperCase();
          const ws = workbook.Sheets[nombreHoja];
          const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: null });

          // Filtrar filas vacías
          const rowsValidas = rows.filter((r) => {
            const saldo = r['SALDO'] ?? r['Saldo'] ?? r['saldo'];
            const fecha = r['FECHA'] ?? r['Fecha'] ?? r['fecha'];
            return !(
              (saldo === 0 || saldo === null) &&
              (fecha === 0 || fecha === null || fecha === '')
            );
          });

          if (rowsValidas.length === 0) continue;

          // Obtener nombre del producto de la cabecera de la hoja o del nombre de la hoja
          const nombreProducto = nombreHoja.trim();

          // Upsert del producto
          let producto = await tx.producto.findFirst({
            where: { nombre: { equals: nombreProducto, mode: 'insensitive' } },
          });

          if (!producto) {
            producto = await tx.producto.create({
              data: {
                nombre: nombreProducto,
                categoria,
                stockActual: 0,
                unidadMedida: 'UND',
              },
            });
            productosCreados++;
          }

          let saldoAcumulado = Number(producto.stockActual);

          for (const row of rowsValidas) {
            try {
              // Parsear fecha numérica Excel → Date
              const fechaRaw = row['FECHA'] ?? row['Fecha'] ?? row['fecha'];
              let fecha: Date;
              if (typeof fechaRaw === 'number' && fechaRaw > 0) {
                fecha = new Date((fechaRaw - 25569) * 86400 * 1000);
              } else if (fechaRaw) {
                fecha = new Date(fechaRaw);
              } else {
                fecha = new Date();
              }

              const entradaRaw = row['ENTRADA'] ?? row['Entrada'] ?? row['entrada'] ?? 0;
              const salidaRaw = row['SALIDA'] ?? row['Salida'] ?? row['salida'] ?? 0;
              const motivo = row['MOTIVO'] ?? row['Motivo'] ?? row['motivo'] ?? '';

              const entrada = Number(entradaRaw) || 0;
              const salida = Number(salidaRaw) || 0;

              if (entrada === 0 && salida === 0) continue;

              let tipo: TipoMovimientoKardex;
              let cantidad: number;

              if (entrada > 0) {
                tipo = TipoMovimientoKardex.ENTRADA;
                cantidad = entrada;
                saldoAcumulado += entrada;
              } else {
                tipo = TipoMovimientoKardex.SALIDA;
                cantidad = salida;
                saldoAcumulado = Math.max(0, saldoAcumulado - salida);
              }

              await tx.movimientoKardex.create({
                data: {
                  productoId: producto!.id,
                  fecha,
                  tipo,
                  cantidad,
                  saldoResultante: saldoAcumulado,
                  motivo: String(motivo),
                },
              });
              movimientosCreados++;
            } catch (err: any) {
              errores.push(`[${nombreHoja}] ${err.message}`);
            }
          }

          // Actualizar stock final del producto
          await tx.producto.update({
            where: { id: producto!.id },
            data: { stockActual: saldoAcumulado },
          });
        }
      },
      { timeout: 60000 },
    );

    this.logger.log(
      `Importación completa: ${productosCreados} productos nuevos, ${movimientosCreados} movimientos, ${errores.length} errores`,
    );

    return {
      importados: movimientosCreados,
      productos: productosCreados,
      errores,
    };
  }
}
