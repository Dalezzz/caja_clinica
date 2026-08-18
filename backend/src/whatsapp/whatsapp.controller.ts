import { Controller, Get, Post, Res, HttpStatus } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { Response } from 'express';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get('status')
  async getStatus(@Res() res: Response) {
    const status = this.whatsappService.getStatus();
    
    if (status.status === 'qr') {
      return res.status(HttpStatus.OK).json({
        status: 'qr',
        qr: status.qr, // QR Base64
      });
    }

    return res.status(HttpStatus.OK).json({
      status: status.status,
    });
  }

  @Post('logout')
  async logout(@Res() res: Response) {
    await this.whatsappService.logout();
    return res.status(HttpStatus.OK).json({ success: true });
  }

  @Get('missed')
  async getMissedReports(@Res() res: Response) {
    const result = await this.whatsappService.checkMissedReports();
    return res.status(HttpStatus.OK).json(result);
  }

  @Post('send-missed')
  async sendMissedReports(@Res() res: Response) {
    await this.whatsappService.triggerMissedReport();
    return res.status(HttpStatus.OK).json({ success: true });
  }
}
