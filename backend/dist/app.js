"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const errorHandler_1 = require("./middleware/errorHandler");
const logger_1 = require("./utils/logger");
const testCloudStorage_1 = require("./utils/testCloudStorage");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const student_routes_simple_1 = __importDefault(require("./routes/student.routes.simple"));
const document_routes_1 = __importDefault(require("./routes/document.routes"));
const faculty_routes_1 = __importDefault(require("./routes/faculty.routes"));
const department_routes_1 = __importDefault(require("./routes/department.routes"));
const academicYear_routes_1 = __importDefault(require("./routes/academicYear.routes"));
const academic_routes_optimized_1 = __importDefault(require("./routes/academic.routes.optimized"));
const verification_routes_1 = __importDefault(require("./routes/verification.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const auditlog_routes_1 = __importDefault(require("./routes/auditlog.routes"));
const app = (0, express_1.default)();
app.get('/health', (_req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
app.get('/', (_req, res) => {
    res.json({
        status: 'EAU Credential System API - ULTRA OPTIMIZED VERSION',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        message: 'API running with ultra-fast academic data and student details optimization'
    });
});
app.use((req, res, next) => {
    if (req.path === '/' || req.path === '/health') {
        return next();
    }
    const start = performance.now();
    res.on('finish', () => {
        const duration = performance.now() - start;
        if (duration > 1000) {
            logger_1.logger.warn(`🐌 Slow API endpoint: ${req.method} ${req.path} took ${duration.toFixed(2)}ms`);
        }
        else if (duration < 100) {
            logger_1.logger.info(`⚡ Fast API endpoint: ${req.method} ${req.path} took ${duration.toFixed(2)}ms`);
        }
        else {
            logger_1.logger.info(`📊 API endpoint: ${req.method} ${req.path} took ${duration.toFixed(2)}ms`);
        }
    });
    next();
});
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api/dashboard', dashboard_routes_1.default);
app.use('/api/students', student_routes_simple_1.default);
app.use('/api/academic', academic_routes_optimized_1.default);
app.use('/api/documents', document_routes_1.default);
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/faculties', faculty_routes_1.default);
app.use('/api/departments', department_routes_1.default);
app.use('/api/academic-years', academicYear_routes_1.default);
app.use('/api/audit-logs', auditlog_routes_1.default);
app.use('/api', verification_routes_1.default);
app.use(errorHandler_1.errorHandler);
app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    logger_1.logger.info(`🚀 Server is running on port ${PORT} with ULTRA OPTIMIZATION`);
    logger_1.logger.info('Testing cloud storage connection...');
    const storageConnected = await (0, testCloudStorage_1.testCloudStorageConnection)();
    if (!storageConnected) {
        logger_1.logger.warn('Cloud storage connection failed - check your environment variables');
    }
    logger_1.logger.info('✅ Performance monitoring active');
    logger_1.logger.info('✅ Database indexes applied');
    logger_1.logger.info('✅ STUDENT OPTIMIZATION: Simple caching for instant details (5min TTL)');
    logger_1.logger.info('✅ ACADEMIC OPTIMIZATION: Ultra-fast years/faculties/departments (15min TTL)');
    logger_1.logger.info('✅ Ultra-optimized dashboard endpoints with raw SQL');
    logger_1.logger.info('✅ Parallel document upload processing ready');
    logger_1.logger.info('✅ Root endpoint bypass for instant response');
    logger_1.logger.info('🚀 Performance targets: Students <500ms, Academic <200ms, Dashboard <200ms');
});
exports.default = app;
//# sourceMappingURL=app.js.map