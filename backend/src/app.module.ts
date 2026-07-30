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
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { ConsultasModule } from './consultas/consultas.module';
import { ImportadorModule } from './importador/importador.module';

@Module({
  imports: [
    PrismaModule, 
    ProcedenciasModule, 
    MedicosModule, 
    PacientesModule, 
    TarifasModule, 
    CajasDiariasModule, 
    TicketsModule, 
    EgresosModule,
    AuthModule,
    UsuariosModule,
    ConsultasModule,
    ImportadorModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
