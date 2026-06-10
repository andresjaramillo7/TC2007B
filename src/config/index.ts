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
    HTTPS_ENABLED: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
    HTTPS_PORT: z.coerce.number().default(3443),
    TLS_KEY_PATH: z.string().default('.local-certs/localhost-key.pem'),
    TLS_CERT_PATH: z.string().default('.local-certs/localhost-cert.pem'),
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

interface HttpsConfig {
  enabled: boolean;
  port: number;
  keyPath: string;
  certPath: string;
}

interface Config {
  port: number;
  nodeEnv: string;
  db: DbConfig;
  jwt: JwtConfig;
  cors: CorsConfig;
  https: HttpsConfig;
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
  https: {
    enabled: env.HTTPS_ENABLED,
    port: env.HTTPS_PORT,
    keyPath: env.TLS_KEY_PATH,
    certPath: env.TLS_CERT_PATH,
  },
};
