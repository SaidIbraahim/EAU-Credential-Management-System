"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = require("dotenv");
const errorHandler_1 = require("./middleware/errorHandler");
const notFoundHandler_1 = require("./middleware/notFoundHandler");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const faculty_routes_1 = __importDefault(require("./routes/faculty.routes"));
const department_routes_1 = __importDefault(require("./routes/department.routes"));
const academicYear_routes_1 = __importDefault(require("./routes/academicYear.routes"));
(0, dotenv_1.config)();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});
app.use('/api/auth', auth_routes_1.default);
app.use('/api/faculties', faculty_routes_1.default);
app.use('/api/departments', department_routes_1.default);
app.use('/api/academic-years', academicYear_routes_1.default);
app.use('*', notFoundHandler_1.notFoundHandler);
app.use((err, req, res, next) => {
    (0, errorHandler_1.errorHandler)(err, req, res, next);
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map