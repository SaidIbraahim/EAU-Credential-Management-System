import { z } from 'zod';

export const createDocumentSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    type: z.string().min(1, 'Document type is required'),
    studentId: z.string().regex(/^\d+$/, 'Invalid student ID').transform(Number),
  })
});

export const updateDocumentSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').optional(),
    description: z.string().optional(),
    type: z.string().min(1, 'Document type is required').optional(),
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  }),
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid document ID').transform(Number),
  }),
});

export const documentIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid document ID').transform(Number),
  }),
});

export const getDocumentsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/, 'Invalid page number').transform(Number).optional(),
    limit: z.string().regex(/^\d+$/, 'Invalid limit number').transform(Number).optional(),
    studentId: z.string().regex(/^\d+$/, 'Invalid student ID').transform(Number).optional(),
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
    type: z.string().optional(),
  }),
}); 