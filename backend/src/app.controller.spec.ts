import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  it('exposes a health endpoint', () => {
    const controller = new AppController(new AppService());

    expect(controller.getHealth()).toEqual(
      expect.objectContaining({
        status: 'ok',
        service: 'caja-clinica-backend',
      }),
    );
  });
});
