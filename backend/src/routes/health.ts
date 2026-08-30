import type { FastifyPluginAsync } from 'fastify';
import type { HealthDatabase } from '../db/client.js';

interface HealthRouteOptions {
  database: HealthDatabase;
}

export const healthRoutes: FastifyPluginAsync<HealthRouteOptions> = async (
  app,
  options
) => {
  app.get('/health/live', async () => ({ status: 'ok' }));

  app.get('/health', async (_request, reply) => {
    try {
      await options.database.check();
      return { status: 'ready' };
    } catch (error) {
      app.log.error({ error }, 'Database readiness check failed');
      return reply.code(503).send({ status: 'unavailable' });
    }
  });
};
