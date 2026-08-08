const LEGACY_JWT_SECRET = 'screenadvait_super_secret_jwt_key_2026';

export function validateEnvironment(config: Record<string, unknown>) {
  const nodeEnv = String(config.NODE_ENV || 'development');
  const jwtSecret = String(config.JWT_SECRET || '');
  const refreshSecret = String(config.JWT_REFRESH_SECRET || '');
  const databaseUrl = String(config.DATABASE_URL || '');
  const storageProvider = String(config.STORAGE_PROVIDER || 'local').toLowerCase();
  const autoSeed = String(config.AUTO_SEED || 'false').toLowerCase() === 'true';

  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    throw new Error('NODE_ENV must be development, test, or production');
  }
  if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
    throw new Error('DATABASE_URL must be a PostgreSQL connection string');
  }
  if (jwtSecret.length < 32 || refreshSecret.length < 32) {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must each contain at least 32 characters');
  }
  if (jwtSecret === refreshSecret) {
    throw new Error('JWT access and refresh secrets must be different');
  }
  if (!['local', 'google-drive'].includes(storageProvider)) {
    throw new Error('STORAGE_PROVIDER must be local or google-drive');
  }
  if (autoSeed) {
    const superadminPassword = String(config.SUPERADMIN_PASSWORD || '');
    const demoPassword = String(config.SEED_DEMO_PASSWORD || '');
    if (superadminPassword.length < 12 || demoPassword.length < 12) {
      throw new Error(
        'AUTO_SEED requires SUPERADMIN_PASSWORD and SEED_DEMO_PASSWORD with at least 12 characters',
      );
    }
  }
  if (nodeEnv === 'production') {
    if (jwtSecret === LEGACY_JWT_SECRET || /replace|change|secret/i.test(jwtSecret)) {
      throw new Error('A strong non-placeholder JWT_SECRET is required in production');
    }
    const origins = String(config.CORS_ORIGINS || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    if (!origins.length || origins.some((origin) => !origin.startsWith('https://'))) {
      throw new Error('Production CORS_ORIGINS must contain explicit HTTPS origins');
    }
  }
  return { ...config, NODE_ENV: nodeEnv, STORAGE_PROVIDER: storageProvider, AUTO_SEED: autoSeed };
}
