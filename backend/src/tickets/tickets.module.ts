import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SunatModule } from '../sunat/sunat.module';

@Module({
  imports: [PrismaModule, SunatModule],
  controllers: [TicketsController],
  providers: [TicketsService],
})
export class TicketsModule {}
