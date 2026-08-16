import { ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  it('allows public health and login routes without a bearer token', () => {
    const jwtService = { verify: jest.fn() } as unknown as JwtService;
    const guard = new JwtAuthGuard(jwtService);

    const healthContext = {
      switchToHttp: () => ({
        getRequest: () => ({ method: 'GET', path: '/health', headers: {} }),
      }),
    } as ExecutionContext;

    const loginContext = {
      switchToHttp: () => ({
        getRequest: () => ({ method: 'POST', path: '/auth/login', headers: {} }),
      }),
    } as ExecutionContext;

    expect(guard.canActivate(healthContext)).toBe(true);
    expect(guard.canActivate(loginContext)).toBe(true);
    expect(jwtService.verify).not.toHaveBeenCalled();
  });
});
