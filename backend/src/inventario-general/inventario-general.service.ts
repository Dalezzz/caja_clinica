import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TipoUbicacion, EstadoActivo } from '@prisma/client';

@Injectable()
export class InventarioGeneralService {
  private readonly logger = new Logger(InventarioGeneralService.name);

  constructor(private prisma: PrismaService) {}

  // ──────────────────────────────────────────────
  // UBICACIONES
  // ──────────────────────────────────────────────

  async findAllUbicaciones(busqueda?: string, tipo?: TipoUbicacion) {
    return this.prisma.ubicacion.findMany({
      where: {
        ...(busqueda && {
          nombre: { contains: busqueda, mode: 'insensitive' },
        }),
        ...(tipo && { tipo }),
      },
      include: {
        medico: { select: { id: true, nombre: true, especialidad: true } },
        _count: { select: { activos: true } },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async findOneUbicacion(id: number) {
    const ubicacion = await this.prisma.ubicacion.findUnique({
      where: { id },
      include: {
        medico: true,
        activos: {
          include: {
            categoria: true,
          },
          orderBy: { nombre: 'asc' },
        },
      },
    });

    if (!ubicacion) {
      throw new NotFoundException(`Ubicación con ID ${id} no encontrada`);
    }

    return ubicacion;
  }

  async createUbicacion(data: {
    nombre: string;
    tipo?: TipoUbicacion;
    piso?: string;
    descripcion?: string;
    especialidad?: string;
    medicoId?: number;
  }) {
    const existe = await this.prisma.ubicacion.findUnique({
      where: { nombre: data.nombre },
    });

    if (existe) {
      return existe;
    }

    return this.prisma.ubicacion.create({
      data: {
        nombre: data.nombre,
        tipo: data.tipo || TipoUbicacion.AREA_COMUN,
        piso: data.piso,
        descripcion: data.descripcion,
        especialidad: data.especialidad,
        medicoId: data.medicoId,
      },
    });
  }

  // ──────────────────────────────────────────────
  // CATEGORÍAS DE ACTIVOS
  // ──────────────────────────────────────────────

  async findAllCategorias() {
    return this.prisma.categoriaActivo.findMany({
      orderBy: { nombre: 'asc' },
    });
  }

  async findOrCreateCategoria(nombre: string) {
    const limpia = nombre.trim();
    const existe = await this.prisma.categoriaActivo.findUnique({
      where: { nombre: limpia },
    });
    if (existe) return existe;

    return this.prisma.categoriaActivo.create({
      data: { nombre: limpia },
    });
  }

  // ──────────────────────────────────────────────
  // ACTIVOS FIJOS
  // ──────────────────────────────────────────────

  async findAllActivos(query?: {
    busqueda?: string;
    ubicacionId?: number;
    categoriaId?: number;
    estado?: EstadoActivo;
  }) {
    const { busqueda, ubicacionId, categoriaId, estado } = query || {};

    return this.prisma.activoFijo.findMany({
      where: {
        ...(busqueda && {
          OR: [
            { nombre: { contains: busqueda, mode: 'insensitive' } },
            { codigoPatrimonial: { contains: busqueda, mode: 'insensitive' } },
            { observaciones: { contains: busqueda, mode: 'insensitive' } },
          ],
        }),
        ...(ubicacionId && { ubicacionId }),
        ...(categoriaId && { categoriaId }),
        ...(estado && { estado }),
      },
      include: {
        ubicacion: true,
        categoria: true,
      },
      orderBy: [{ ubicacion: { nombre: 'asc' } }, { nombre: 'asc' }],
    });
  }

  async createActivo(data: {
    codigoPatrimonial?: string;
    nombre: string;
    descripcion?: string;
    categoriaNombre?: string;
    categoriaId?: number;
    ubicacionId: number;
    cantidad?: number;
    estado?: EstadoActivo;
    observaciones?: string;
  }) {
    let catId = data.categoriaId;
    if (!catId && data.categoriaNombre) {
      const cat = await this.findOrCreateCategoria(data.categoriaNombre);
      catId = cat.id;
    }

    if (!catId) {
      const catGen = await this.findOrCreateCategoria('General');
      catId = catGen.id;
    }

    return this.prisma.activoFijo.create({
      data: {
        codigoPatrimonial: data.codigoPatrimonial || undefined,
        nombre: data.nombre,
        descripcion: data.descripcion,
        categoriaId: catId,
        ubicacionId: data.ubicacionId,
        cantidad: data.cantidad || 1,
        estado: data.estado || EstadoActivo.OPERATIVO,
        observaciones: data.observaciones,
      },
      include: {
        ubicacion: true,
        categoria: true,
      },
    });
  }

  async updateActivo(
    id: number,
    data: {
      nombre?: string;
      descripcion?: string;
      categoriaId?: number;
      ubicacionId?: number;
      cantidad?: number;
      estado?: EstadoActivo;
      observaciones?: string;
    },
  ) {
    const existe = await this.prisma.activoFijo.findUnique({ where: { id } });
    if (!existe) {
      throw new NotFoundException(`Activo fijo con ID ${id} no encontrado`);
    }

    return this.prisma.activoFijo.update({
      where: { id },
      data,
      include: {
        ubicacion: true,
        categoria: true,
      },
    });
  }

  async trasladarActivo(
    id: number,
    data: {
      nuevaUbicacionId: number;
      cantidadATrasladar?: number;
      motivo?: string;
      usuarioId?: number;
    },
  ) {
    const activo = await this.prisma.activoFijo.findUnique({ where: { id } });
    if (!activo) {
      throw new NotFoundException(`Activo fijo con ID ${id} no encontrado`);
    }

    if (activo.ubicacionId === data.nuevaUbicacionId) {
      throw new BadRequestException('El activo ya se encuentra en esta ubicación.');
    }

    const origenId = activo.ubicacionId;
    const cantATrasladar = Math.min(
      activo.cantidad,
      Math.max(1, data.cantidadATrasladar || activo.cantidad),
    );

    return this.prisma.$transaction(async (tx) => {
      // 1. Registrar el traslado en el historial
      await tx.trasladoActivo.create({
        data: {
          activoFijoId: id,
          ubicacionOrigenId: origenId,
          ubicacionDestinoId: data.nuevaUbicacionId,
          motivo: data.motivo
            ? `${data.motivo} (Cantidad: ${cantATrasladar})`
            : `Traslado de ${cantATrasladar} unidad(es)`,
          usuarioId: data.usuarioId,
        },
      });

      // 2. Verificar si en la ubicación destino YA existe un activo con el mismo nombre
      const destinoExistente = await tx.activoFijo.findFirst({
        where: {
          ubicacionId: data.nuevaUbicacionId,
          nombre: { equals: activo.nombre, mode: 'insensitive' },
        },
      });

      if (destinoExistente) {
        await tx.activoFijo.update({
          where: { id: destinoExistente.id },
          data: {
            cantidad: destinoExistente.cantidad + cantATrasladar,
          },
        });
      } else {
        await tx.activoFijo.create({
          data: {
            nombre: activo.nombre,
            codigoPatrimonial: activo.codigoPatrimonial,
            descripcion: activo.descripcion,
            categoriaId: activo.categoriaId,
            ubicacionId: data.nuevaUbicacionId,
            cantidad: cantATrasladar,
            estado: activo.estado,
            observaciones: activo.observaciones,
          },
        });
      }

      // 3. Descontar o eliminar del origen
      if (cantATrasladar >= activo.cantidad) {
        return tx.activoFijo.delete({
          where: { id },
        });
      } else {
        return tx.activoFijo.update({
          where: { id },
          data: {
            cantidad: activo.cantidad - cantATrasladar,
          },
          include: {
            ubicacion: true,
            categoria: true,
          },
        });
      }
    });
  }

  // ──────────────────────────────────────────────
  // ESTADÍSTICAS Y RESUMEN
  // ──────────────────────────────────────────────

  async getEstadisticas() {
    const totalUbicaciones = await this.prisma.ubicacion.count();
    const totalActivos = await this.prisma.activoFijo.aggregate({
      _sum: { cantidad: true },
      _count: { id: true },
    });

    const porEstado = await this.prisma.activoFijo.groupBy({
      by: ['estado'],
      _sum: { cantidad: true },
      _count: { id: true },
    });

    const porTipoUbicacion = await this.prisma.ubicacion.groupBy({
      by: ['tipo'],
      _count: { id: true },
    });

    return {
      totalUbicaciones,
      totalRegistrosActivos: totalActivos._count.id || 0,
      totalUnidadesActivos: totalActivos._sum.cantidad || 0,
      porEstado: porEstado.map((e) => ({
        estado: e.estado,
        cantidad: e._sum.cantidad || 0,
        registros: e._count.id,
      })),
      porTipoUbicacion: porTipoUbicacion.map((u) => ({
        tipo: u.tipo,
        total: u._count.id,
      })),
    };
  }
}
