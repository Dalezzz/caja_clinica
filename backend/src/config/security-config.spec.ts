import { getAllowedOrigins, getRequiredEnv } from './security-config';

describe('security-config', () => {
  const originalJwtSecret = process.env.JWT_SECRET;
  const originalCorsOrigin = process.env.CORS_ORIGIN;

  afterEach(() => {
    if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalJwtSecret;

    if (originalCorsOrigin === undefined) delete process.env.CORS_ORIGIN;
    else process.env.CORS_ORIGIN = originalCorsOrigin;
  });

  it('throws when JWT_SECRET is missing', () => {
    delete process.env.JWT_SECRET;
    expect(() => getRequiredEnv('JWT_SECRET')).toThrow('Missing required environment variable: JWT_SECRET');
  });

  it('parses the allowed CORS origins from a comma-separated list', () => {
    process.env.CORS_ORIGIN = 'http://localhost:5173,https://app.example.com';
    expect(getAllowedOrigins()).toEqual(['http://localhost:5173', 'https://app.example.com']);
  });
});
