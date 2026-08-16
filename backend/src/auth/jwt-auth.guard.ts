import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    if (req.method === 'OPTIONS') return true;
    if (req.path && (req.path === '/health' || req.path.includes('/auth/login'))) return true;

    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader) throw new UnauthorizedException('Authorization header missing');

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') throw new UnauthorizedException('Invalid authorization header');

    const token = parts[1];
    try {
      const payload = this.jwtService.verify(token);
      req.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
