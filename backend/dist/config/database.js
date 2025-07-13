"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseHealthCheck = exports.disconnectDatabase = exports.connectDatabase = exports.resetDbStats = exports.dbStats = exports.prisma = exports.DatabaseConnection = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
class DatabaseConnection {
    constructor() {
        this.queryStats = {
            totalQueries: 0,
            slowQueries: 0,
            responseTimes: [],
            lastReset: new Date()
        };
        this.prismaClient = new client_1.PrismaClient({
            log: [
                { level: 'query', emit: 'event' },
                { level: 'error', emit: 'stdout' },
                { level: 'info', emit: 'stdout' },
                { level: 'warn', emit: 'stdout' },
            ],
        });
        this.setupEventHandlers();
    }
    static getInstance() {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }
    setupEventHandlers() {
        try {
            this.prismaClient.$on('query', (event) => {
                this.queryStats.totalQueries++;
                if (event.duration && typeof event.duration === 'number') {
                    this.queryStats.responseTimes.push(event.duration);
                    if (event.duration > 1000) {
                        this.queryStats.slowQueries++;
                        console.warn(`⚠️ Slow ${event.target || 'Unknown'}: ${event.duration}ms`);
                        if (event.query && typeof event.query === 'string') {
                            console.warn(`   Query: ${event.query.substring(0, 100)}...`);
                        }
                    }
                }
                if (this.queryStats.responseTimes.length > 100) {
                    this.queryStats.responseTimes = this.queryStats.responseTimes.slice(-100);
                }
            });
        }
        catch (error) {
            logger_1.logger.warn('Query monitoring setup failed:', error);
        }
    }
    getQueryStats() {
        const responseTimes = this.queryStats.responseTimes;
        const avgResponseTime = responseTimes.length > 0
            ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
            : 0;
        return {
            totalQueries: this.queryStats.totalQueries,
            slowQueries: this.queryStats.slowQueries,
            averageResponseTime: Math.round(avgResponseTime * 100) / 100,
            slowQueryPercentage: this.queryStats.totalQueries > 0
                ? Math.round((this.queryStats.slowQueries / this.queryStats.totalQueries) * 100 * 100) / 100
                : 0,
            lastReset: this.queryStats.lastReset
        };
    }
    resetStats() {
        this.queryStats = {
            totalQueries: 0,
            slowQueries: 0,
            responseTimes: [],
            lastReset: new Date()
        };
        logger_1.logger.info('📊 Database statistics reset');
    }
    getClient() {
        return this.prismaClient;
    }
    async connect() {
        try {
            await this.prismaClient.$connect();
            logger_1.logger.info('✅ Database connected successfully');
        }
        catch (error) {
            logger_1.logger.error('❌ Database connection failed:', error);
            throw error;
        }
    }
    async disconnect() {
        try {
            await this.prismaClient.$disconnect();
            logger_1.logger.info('🔌 Database disconnected');
        }
        catch (error) {
            logger_1.logger.error('❌ Database disconnection failed:', error);
            throw error;
        }
    }
    async healthCheck() {
        try {
            await this.prismaClient.$queryRaw `SELECT 1`;
            return true;
        }
        catch (error) {
            logger_1.logger.error('❌ Database health check failed:', error);
            return false;
        }
    }
}
exports.DatabaseConnection = DatabaseConnection;
const dbConnection = DatabaseConnection.getInstance();
exports.prisma = dbConnection.getClient();
const dbStats = () => dbConnection.getQueryStats();
exports.dbStats = dbStats;
const resetDbStats = () => dbConnection.resetStats();
exports.resetDbStats = resetDbStats;
const connectDatabase = () => dbConnection.connect();
exports.connectDatabase = connectDatabase;
const disconnectDatabase = () => dbConnection.disconnect();
exports.disconnectDatabase = disconnectDatabase;
const databaseHealthCheck = () => dbConnection.healthCheck();
exports.databaseHealthCheck = databaseHealthCheck;
//# sourceMappingURL=database.js.map