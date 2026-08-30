import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import Fastify, { type FastifyBaseLogger } from 'fastify';
import type { AppConfig } from './config.js';
import type { ProductDatabase } from './db/client.js';
import type { ProductNotifier } from './notifications/telegram.js';
import { healthRoutes } from './routes/health.js';
import { productRoutes } from './routes/product.js';

interface BuildAppOptions {
  config: AppConfig;
  database: ProductDatabase;
  notifier?: ProductNotifier;
  logger?: boolean | FastifyBaseLogger;
}

export function buildApp(options: BuildAppOptions) {
  const app = Fastify({
    logger:
      options.logger ??
      {
        level: options.config.logLevel,
        redact: ['req.headers.authorization', 'req.headers.cookie']
      },
    bodyLimit: 32 * 1024,
    trustProxy: true
  });

  void app.register(helmet, {
    contentSecurityPolicy: false
  });

  void app.register(cors, {
    origin: options.config.appOrigins,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['content-type'],
    credentials: false,
    maxAge: 86_400
  });

  void app.register(rateLimit, {
    max: 120,
    timeWindow: '1 minute'
  });

  void app.register(healthRoutes, { database: options.database });
  void app.register(productRoutes, {
    database: options.database,
    ...(options.notifier ? { notifier: options.notifier } : {}),
    ...(options.config.reportToken ? { reportToken: options.config.reportToken } : {})
  });

  app.setNotFoundHandler(async (_request, reply) => {
    return reply.code(404).send({ error: 'not_found' });
  });

  app.setErrorHandler(async (error, _request, reply) => {
    app.log.error({ error }, 'Unhandled request error');
    return reply.code(500).send({ error: 'internal_error' });
  });

  return app;
}
