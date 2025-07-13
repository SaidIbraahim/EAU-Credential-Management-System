"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
exports.prisma = new client_1.PrismaClient({
    log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' }
    ],
    datasources: {
        db: {
            url: process.env.DATABASE_URL + '?connection_limit=10&pool_timeout=20'
        }
    }
});
exports.prisma.$on('query', (e) => {
    if (e.duration > 1000) {
        console.log(`🐌 Slow Query (${e.duration}ms): ${e.query.substring(0, 100)}...`);
    }
});
exports.prisma.$use(async (params, next) => {
    const before = Date.now();
    const result = await next(params);
    const after = Date.now();
    const duration = after - before;
    if (duration > 500) {
        console.log(`⚠️ Slow ${params.model}.${params.action}: ${duration}ms`);
    }
    return result;
});
//# sourceMappingURL=prisma.js.map