import { Module } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [UsuariosService],
  exports: [UsuariosService],
})
export class UsuariosModule {}
