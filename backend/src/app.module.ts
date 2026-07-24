import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProcedenciasModule } from './procedencias/procedencias.module';
import { MedicosModule } from './medicos/medicos.module';
import { PacientesModule } from './pacientes/pacientes.module';
import { TarifasModule } from './tarifas/tarifas.module';
import { CajasDiariasModule } from './cajas-diarias/cajas-diarias.module';
import { TicketsModule } from './tickets/tickets.module';
import { EgresosModule } from './egresos/egresos.module';

@Module({
  imports: [PrismaModule, ProcedenciasModule, MedicosModule, PacientesModule, TarifasModule, CajasDiariasModule, TicketsModule, EgresosModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
