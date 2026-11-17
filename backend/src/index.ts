import Fastify from 'fastify';
import cors from '@fastify/cors';
import { initDatabase } from './db/database.js';
import { catalogRoutes } from './routes/catalogRoutes.js';
import { orderRoutes } from './routes/orderRoutes.js';
import { billingRoutes } from './routes/billingRoutes.js';
import { kitchenRoutes } from './routes/kitchenRoutes.js';
import { reportRoutes } from './routes/reportRoutes.js';
import { outletRoutes } from './routes/outletRoutes.js';

const fastify = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
      },
    },
  },
  disableRequestLogging: false,
});

async function startServer() {
  try {
    // 1. CORS Configuration
    await fastify.register(cors, {
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      credentials: true,
    });

    // 2. Initialize Low-Memory SQLite Database
    fastify.log.info('Initializing SQLite database engine with WAL mode...');
    await initDatabase();
    fastify.log.info('Database initialized successfully with production schema and seed catalog.');

    // 3. Register Routes
    await fastify.register(catalogRoutes);
    await fastify.register(orderRoutes);
    await fastify.register(billingRoutes);
    await fastify.register(kitchenRoutes);
    await fastify.register(reportRoutes);
    await fastify.register(outletRoutes);

    // 4. Health Check
    fastify.get('/health', async () => ({
      status: 'UP',
      memoryUsageMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    }));

    // 5. Start Listening
    const port = Number(process.env.PORT) || 8080;
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });
    fastify.log.info(`⚡ Pop O' Bob High-Performance POS Server running at http://${host}:${port}`);
    fastify.log.info(`📊 Memory footprint: ~${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB RAM (vs 600MB+ in Java)`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

startServer();
