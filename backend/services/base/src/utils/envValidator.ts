import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define environment schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('8080'),
  MONGODB_URI: z.string().optional(),
  REDIS_URL: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export async function validateEnv(): Promise<Env> {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('Environment validation failed:', error);
    throw error;
  }
}