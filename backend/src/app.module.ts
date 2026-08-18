import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
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
import { AlquileresModule } from './alquileres/alquileres.module';
import { EstadisticasMedicoModule } from './estadisticas-medico/estadisticas-medico.module';
import { ComprobantePagoMedicoModule } from './comprobante-pago-medico/comprobante-pago-medico.module';
import { ReportesModule } from './reportes/reportes.module';
import { PdfGeneratorModule } from './pdf-generator/pdf-generator.module';

import { ScheduleModule } from '@nestjs/schedule';
import { WhatsappModule } from './whatsapp/whatsapp.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    WhatsappModule,
    ThrottlerModule.forRoot([{ ttl: 60, limit: 120 }]),
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
    ImportadorModule,
    AlquileresModule,
    EstadisticasMedicoModule,
    ComprobantePagoMedicoModule,
    ReportesModule,
    PdfGeneratorModule,
  ],
  controllers: [AppController],
  providers: (() => {
    const providers: any[] = [
      AppService,
      {
        provide: APP_GUARD,
        useClass: ThrottlerGuard,
      },
    ];
    if (process.env.DISABLE_AUTH !== 'true') {
      providers.push({ provide: APP_GUARD, useClass: JwtAuthGuard });
      providers.push({ provide: APP_GUARD, useClass: RolesGuard });
    }
    return providers;
  })(),
})
export class AppModule {}
