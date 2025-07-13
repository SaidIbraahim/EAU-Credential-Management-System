"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const customError_1 = require("../utils/customError");
const validate = (schema) => async (req, _res, next) => {
    try {
        await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            const validationError = new customError_1.CustomError(400, 'Validation failed', error.errors.map((err) => ({
                path: err.path.join('.'),
                message: err.message,
            })));
            next(validationError);
        }
        else {
            next(error);
        }
    }
};
exports.validate = validate;
//# sourceMappingURL=validate.js.map