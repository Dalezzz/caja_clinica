import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsuariosService } from '../usuarios/usuarios.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private usuariosService: UsuariosService,
    private jwtService: JwtService,
  ) {}

  async validarUsuario(
    usuarioName: string,
    contrasenaPlain: string,
  ): Promise<any> {
    const user = await this.usuariosService.findOne(usuarioName);
    if (user && (await bcrypt.compare(contrasenaPlain, user.contrasena))) {
      const { contrasena, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = {
      username: user.usuario,
      sub: user.id,
      rol: user.rol,
      nombre: user.nombre,
    };
    return {
      access_token: this.jwtService.sign(payload),
      usuario: {
        id: user.id,
        nombre: user.nombre,
        usuario: user.usuario,
        rol: user.rol,
      },
    };
  }
}
