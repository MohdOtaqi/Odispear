import dotenv from 'dotenv';

dotenv.config();

export function validateEnvironment(): void {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'PORT',
  ];

  // Optional environment variables (warn if missing but don't fail)
  const optional = ['REDIS_URL'];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error('Missing required environment variables:');
    missing.forEach((key) => console.error(`  - ${key}`));
    process.exit(1);
  }

  // Check optional vars
  const missingOptional = optional.filter((key) => !process.env[key] && process.env.DISABLE_REDIS !== 'true');
  if (missingOptional.length > 0) {
    console.warn('Optional environment variables not set (some features may be limited):');
    missingOptional.forEach((key) => console.warn(`  - ${key}`));
  }

  // Validate JWT_SECRET length
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn('WARNING: JWT_SECRET should be at least 32 characters long for security');
  }

  console.log('✓ Environment validation passed');
}
