/**
 * Fail fast on configuration that is safe in development but dangerous in
 * production. A placeholder JWT_SECRET reaching a live deployment means every
 * token in the system is forgeable, and that is not something to discover from
 * an incident — so in production these are hard errors, not warnings.
 */

/** Secrets shipped in .env.example / documentation that must never reach production. */
const KNOWN_PLACEHOLDER_SECRETS = [
  'your-super-secret-jwt-key-change-in-production-min-32-chars',
  'your-secret-key',
  'changeme',
  'secret',
];

const MIN_SECRET_LENGTH = 32;

export function validateEnv(): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const problems: string[] = [];
  const warnings: string[] = [];

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    problems.push('JWT_SECRET is not set.');
  } else if (KNOWN_PLACEHOLDER_SECRETS.includes(jwtSecret.trim().toLowerCase())) {
    problems.push(
      'JWT_SECRET is still the example placeholder. Generate one with: ' +
        'node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64url\'))"'
    );
  } else if (jwtSecret.length < MIN_SECRET_LENGTH) {
    problems.push(`JWT_SECRET is shorter than ${MIN_SECRET_LENGTH} characters.`);
  }

  if (!process.env.DATABASE_URL) {
    problems.push('DATABASE_URL is not set.');
  }

  if (isProduction && !process.env.CORS_ORIGIN) {
    warnings.push('CORS_ORIGIN is not set — the API will accept every origin.');
  }

  for (const warning of warnings) {
    console.warn(`[config] ${warning}`);
  }

  if (problems.length === 0) return;

  if (isProduction) {
    console.error('[config] Refusing to start with an unsafe configuration:');
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exit(1);
  }

  console.warn('[config] Configuration problems (fatal in production):');
  for (const problem of problems) console.warn(`  - ${problem}`);
}
