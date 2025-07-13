"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDocumentsSchema = exports.documentIdSchema = exports.updateDocumentSchema = exports.createDocumentSchema = void 0;
const zod_1 = require("zod");
exports.createDocumentSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1, 'Title is required'),
        description: zod_1.z.string().optional(),
        studentId: zod_1.z.string().regex(/^\d+$/, 'Invalid student ID').transform(Number),
    }),
    params: zod_1.z.object({
        type: zod_1.z.enum(['photo', 'transcript', 'certificate', 'supporting'], {
            errorMap: () => ({ message: 'Invalid document type' })
        })
    })
});
exports.updateDocumentSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1, 'Title is required').optional(),
        description: zod_1.z.string().optional(),
    }),
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/, 'Invalid document ID').transform(Number),
    }),
});
exports.documentIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/, 'Invalid document ID').transform(Number),
    }),
});
exports.getDocumentsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/, 'Invalid page number').transform(Number).optional(),
        limit: zod_1.z.string().regex(/^\d+$/, 'Invalid limit number').transform(Number).optional(),
        studentId: zod_1.z.string().regex(/^\d+$/, 'Invalid student ID').transform(Number).optional(),
        type: zod_1.z.enum(['photo', 'transcript', 'certificate', 'supporting']).optional(),
    }),
});
//# sourceMappingURL=document.validator.js.map