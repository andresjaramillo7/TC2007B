import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z
  .object({
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    DB_HOST: z.string().default('localhost'),
    DB_PORT: z.coerce.number().default(5432),
    DB_USER: z.string().min(1, 'DB_USER is required'),
    DB_PASSWORD: z.string().default(''),
    DB_NAME: z.string().min(1, 'DB_NAME is required'),
    JWT_SECRET: z.string().default('dev-secret'),
    JWT_EXPIRES_IN: z.string().default('8h'),
    CORS_ORIGIN: z.string().default('*'),
  })
  .passthrough();

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('Environment variable validation error:', result.error.issues[0].message); // eslint-disable-line no-console
  process.exit(1);
}

const env = result.data;

interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

interface JwtConfig {
  secret: string;
  expiresIn: string;
}

interface CorsConfig {
  origin: string;
}

interface Config {
  port: number;
  nodeEnv: string;
  db: DbConfig;
  jwt: JwtConfig;
  cors: CorsConfig;
}

export const config: Config = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  db: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  },
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },
  cors: {
    origin: env.CORS_ORIGIN,
  },
};
