import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().max(65_535).default(3000),
  HOST: z.string().min(1).default('0.0.0.0'),
  DATABASE_URL: z.string().url(),
  APP_ORIGINS: z.string().min(1),
  DATA_RETENTION_DAYS: z.coerce.number().int().positive().default(365),
  REPORT_TOKEN: z.string().min(32).optional(),
  TELEGRAM_BOT_TOKEN: z.string().min(20).optional(),
  TELEGRAM_CHAT_ID: z.string().regex(/^-?\d+$/).optional(),
  TELEGRAM_NOTIFY_IMAGE_UPLOADS: z.enum(['true', 'false']).default('true'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info')
});

export interface AppConfig {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  host: string;
  databaseUrl: string;
  appOrigins: string[];
  dataRetentionDays: number;
  reportToken?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  telegramNotifyImageUploads: boolean;
  logLevel: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';
}

export function loadConfig(
  environment: NodeJS.ProcessEnv = process.env
): AppConfig {
  const parsed = environmentSchema.safeParse(environment);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'environment'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid backend configuration: ${details}`);
  }

  const appOrigins = parsed.data.APP_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (appOrigins.length === 0) {
    throw new Error('Invalid backend configuration: APP_ORIGINS is empty');
  }

  const config: AppConfig = {
    nodeEnv: parsed.data.NODE_ENV,
    port: parsed.data.PORT,
    host: parsed.data.HOST,
    databaseUrl: parsed.data.DATABASE_URL,
    appOrigins,
    dataRetentionDays: parsed.data.DATA_RETENTION_DAYS,
    telegramNotifyImageUploads: parsed.data.TELEGRAM_NOTIFY_IMAGE_UPLOADS === 'true',
    logLevel: parsed.data.LOG_LEVEL
  };

  if (parsed.data.REPORT_TOKEN) {
    config.reportToken = parsed.data.REPORT_TOKEN;
  }
  if (parsed.data.TELEGRAM_BOT_TOKEN) {
    config.telegramBotToken = parsed.data.TELEGRAM_BOT_TOKEN;
  }
  if (parsed.data.TELEGRAM_CHAT_ID) {
    config.telegramChatId = parsed.data.TELEGRAM_CHAT_ID;
  }

  return config;
}
