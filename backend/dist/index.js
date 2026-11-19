"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const database_js_1 = require("./db/database.js");
const catalogRoutes_js_1 = require("./routes/catalogRoutes.js");
const orderRoutes_js_1 = require("./routes/orderRoutes.js");
const billingRoutes_js_1 = require("./routes/billingRoutes.js");
const kitchenRoutes_js_1 = require("./routes/kitchenRoutes.js");
const reportRoutes_js_1 = require("./routes/reportRoutes.js");
const outletRoutes_js_1 = require("./routes/outletRoutes.js");
const fastify = (0, fastify_1.default)({
    bodyLimit: 50 * 1024 * 1024, // 50 MB body limit to support base64 item photos
    logger: {
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                ignore: 'pid,hostname',
            },
        },
    },
});
async function startServer() {
    try {
        // 1. CORS Configuration
        await fastify.register(cors_1.default, {
            origin: true,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            credentials: true,
        });
        // 2. Initialize Database (PostgreSQL / SQLite WAL)
        fastify.log.info('Initializing production database engine...');
        await (0, database_js_1.initDatabase)();
        fastify.log.info(`Database engine: ${database_js_1.isPostgresActive ? '🐘 POSTGRESQL' : '🗄️ SQLITE (WAL Mode)'}`);
        // 3. Register Routes
        await fastify.register(catalogRoutes_js_1.catalogRoutes);
        await fastify.register(orderRoutes_js_1.orderRoutes);
        await fastify.register(billingRoutes_js_1.billingRoutes);
        await fastify.register(kitchenRoutes_js_1.kitchenRoutes);
        await fastify.register(reportRoutes_js_1.reportRoutes);
        await fastify.register(outletRoutes_js_1.outletRoutes);
        // 4. Root Welcome & Health Check
        fastify.get('/', async () => ({
            name: "Pop O' Bob POS High-Performance Backend API",
            status: 'ONLINE',
            database: database_js_1.isPostgresActive ? 'POSTGRESQL' : 'SQLITE_WAL',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
        }));
        fastify.get('/health', async () => ({
            status: 'UP',
            database: database_js_1.isPostgresActive ? 'POSTGRESQL' : 'SQLITE_WAL',
            memoryUsageMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
            uptimeSeconds: Math.round(process.uptime()),
            timestamp: new Date().toISOString(),
        }));
        // 5. Start Listening
        const port = Number(process.env.PORT) || 8080;
        const host = process.env.HOST || '0.0.0.0';
        await fastify.listen({ port, host });
        fastify.log.info(`⚡ Pop O' Bob High-Performance POS Server running at http://${host}:${port}`);
        fastify.log.info(`🗄️ Active DB Engine: ${database_js_1.isPostgresActive ? 'PostgreSQL 18 (:5432)' : 'LibSQL SQLite WAL'}`);
        fastify.log.info(`📊 Memory footprint: ~${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB RAM (vs 600MB+ in Java)`);
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}
startServer();
