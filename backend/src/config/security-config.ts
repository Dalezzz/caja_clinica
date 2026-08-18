export const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

export function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getAllowedOrigins(): string[] {
  const configured = process.env.CORS_ORIGIN?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return configured && configured.length > 0
    ? configured
    : DEFAULT_ALLOWED_ORIGINS;
}

export function getJwtSecretOrThrow(): string {
  if (process.env.NODE_ENV === 'test') {
    return process.env.JWT_SECRET?.trim() || 'test-jwt-secret';
  }

  return getRequiredEnv('JWT_SECRET');
}
