import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  PORT: z.string().default('3000'),
  APP_ID: z.string(),
  APP_SECRET: z.string(),
  JWT_SECRET: z.string(),
  DATABASE_URL: z.string(),
  KIMI_AUTH_URL: z.string(),
  KIMI_OPEN_URL: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_CALLBACK_URL: z.string(),
});

export const env = envSchema.parse(process.env);