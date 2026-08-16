import { Module } from '@nestjs/common';
import { EstadisticasMedicoService } from './estadisticas-medico.service';
import { EstadisticasMedicoController } from './estadisticas-medico.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EstadisticasMedicoController],
  providers: [EstadisticasMedicoService],
  exports: [EstadisticasMedicoService],
})
export class EstadisticasMedicoModule {}
