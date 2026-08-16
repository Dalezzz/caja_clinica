import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RolUsuario, Usuario } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  async findOne(usuario: string): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({
      where: { usuario },
    });
  }

  async findById(id: number): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({
      where: { id },
    });
  }

  async create(nombre: string, usuario: string, contrasenaPlain: string, rol: RolUsuario): Promise<Usuario> {
    const contrasenaHash = await bcrypt.hash(contrasenaPlain, 10);
    return this.prisma.usuario.create({
      data: {
        nombre,
        usuario,
        contrasena: contrasenaHash,
        rol,
      },
    });
  }
}
