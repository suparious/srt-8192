import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define the base environment schema
const baseEnvSchema = z.object({
  // Service Configuration
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().min(1).max(65535).default(8080),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // Service Identity
  SERVICE_NAME: z.string().min(1),
  SERVICE_VERSION: z.string().default('1.0.0'),

  // MongoDB
  MONGODB_URI: z.string().url(),
  MONGODB_USER: z.string().min(1),
  MONGODB_PASSWORD: z.string().min(1),

  // Redis (optional)
  REDIS_URI: z.string().url().optional(),
  REDIS_PASSWORD: z.string().optional(),

  // Dependencies
  WAIT_FOR_SERVICES: z.string().transform(str => 
    str.split(',').map(s => {
      const [host, port] = s.split(':');
      return { host, port: parseInt(port) };
    })
  ).optional(),

  // Health Check
  HEALTH_CHECK_INTERVAL: z.string().regex(/^\d+[smh]$/).default('30s'),
  HEALTH_CHECK_TIMEOUT: z.string().regex(/^\d+[smh]$/).default('5s'),
  HEALTH_CHECK_RETRIES: z.coerce.number().min(1).default(3),

  // Security
  JWT_SECRET: z.string().min(32),
  CORS_ALLOWED_ORIGINS: z.string().transform(str => str.split(',')),

  // Resource Limits
  MEMORY_LIMIT: z.string().regex(/^\d+[KMG]B?$/).default('512M'),
  CPU_LIMIT: z.coerce.number().min(0.1).max(4.0).default(1.0),

  // Development
  ENABLE_HOT_RELOAD: z.coerce.boolean().default(false),
  DEBUG_MODE: z.coerce.boolean().default(false),
});

// Infer the type from the schema
export type BaseEnvConfig = z.infer<typeof baseEnvSchema>;

/**
 * Validate environment variables against the schema
 * @param additionalSchema Optional additional schema to extend base schema
 * @returns Validated environment object
 * @throws {Error} If validation fails
 */
export function validateEnv<T extends z.ZodType>(additionalSchema?: T): BaseEnvConfig & z.infer<T> {
  try {
    // Merge schemas if additional schema provided
    const schema = additionalSchema 
      ? baseEnvSchema.merge(additionalSchema)
      : baseEnvSchema;

    // Parse and validate environment
    const env = schema.parse(process.env);

    // Log validation success in development
    if (env.NODE_ENV === 'development') {
      console.log('Environment variables validated successfully');
    }

    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => err.path.join('.'));
      throw new Error(`Environment validation failed. Missing or invalid variables: ${missingVars.join(', ')}`);
    }
    throw error;
  }
}

/**
 * Parse duration string to milliseconds
 * @param duration Duration string (e.g., "30s", "5m", "1h")
 * @returns Number of milliseconds
 */
export function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smh])$/);
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
  }

  const [, value, unit] = match;
  const num = parseInt(value);

  switch (unit) {
    case 's':
      return num * 1000;
    case 'm':
      return num * 60 * 1000;
    case 'h':
      return num * 60 * 60 * 1000;
    default:
      throw new Error(`Invalid duration unit: ${unit}`);
  }
}

/**
 * Parse memory string to bytes
 * @param memory Memory string (e.g., "512M", "1G")
 * @returns Number of bytes
 */
export function parseMemory(memory: string): number {
  const match = memory.match(/^(\d+)([KMG]B?)?$/);
  if (!match) {
    throw new Error(`Invalid memory format: ${memory}`);
  }

  const [, value, unit] = match;
  const num = parseInt(value);

  switch (unit?.charAt(0)) {
    case 'K':
      return num * 1024;
    case 'M':
      return num * 1024 * 1024;
    case 'G':
      return num * 1024 * 1024 * 1024;
    default:
      return num;
  }
}