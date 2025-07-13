"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureMiddleware = void 0;
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const logger_1 = require("../utils/logger");
const errorHandler_1 = require("./errorHandler");
const configureMiddleware = (app) => {
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use((0, compression_1.default)());
    app.use((0, morgan_1.default)('combined', {
        stream: logger_1.stream,
        skip: (req) => req.url === '/health',
    }));
    app.use(errorHandler_1.errorHandler);
};
exports.configureMiddleware = configureMiddleware;
//# sourceMappingURL=index.js.map