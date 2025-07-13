"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizedVerificationController = void 0;
const prisma_1 = require("../lib/prisma");
const document_service_1 = require("../services/document.service");
const verificationCache = new Map();
const CACHE_TTL = 1 * 60 * 1000;
class OptimizedVerificationController {
    static async verifyStudent(req, res) {
        try {
            const { identifier } = req.params;
            if (!identifier) {
                return res.status(400).json({
                    success: false,
                    message: 'Identifier is required'
                });
            }
            const cacheKey = `verify_${identifier.trim().toUpperCase()}`;
            const cached = verificationCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
                console.log('⚡ Verification served from cache');
                return res.json(cached.data);
            }
            console.time('⚡ OPTIMIZED Student Verification');
            let student = null;
            const normalizedIdentifier = identifier.trim().toUpperCase();
            try {
                if (normalizedIdentifier.startsWith('GRW-')) {
                    console.log(`🔍 Looking up registration ID: ${normalizedIdentifier}`);
                    student = await prisma_1.prisma.student.findUnique({
                        where: {
                            registrationId: normalizedIdentifier
                        },
                        select: {
                            id: true,
                            registrationId: true,
                            certificateId: true,
                            fullName: true,
                            gender: true,
                            phone: true,
                            gpa: true,
                            grade: true,
                            graduationDate: true,
                            status: true,
                            createdAt: true,
                            department: {
                                select: { id: true, name: true, code: true }
                            },
                            faculty: {
                                select: { id: true, name: true, code: true }
                            },
                            academicYear: {
                                select: { id: true, academicYear: true }
                            }
                        }
                    });
                }
                else if (/^\d+$/.test(identifier)) {
                    console.log(`🔍 Looking up certificate ID: ${identifier}`);
                    student = await prisma_1.prisma.student.findUnique({
                        where: { certificateId: identifier },
                        select: {
                            id: true,
                            registrationId: true,
                            certificateId: true,
                            fullName: true,
                            gender: true,
                            phone: true,
                            gpa: true,
                            grade: true,
                            graduationDate: true,
                            status: true,
                            createdAt: true,
                            department: {
                                select: { id: true, name: true, code: true }
                            },
                            faculty: {
                                select: { id: true, name: true, code: true }
                            },
                            academicYear: {
                                select: { id: true, academicYear: true }
                            }
                        }
                    });
                }
                else {
                    console.log(`❌ Invalid identifier format: ${identifier}`);
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid identifier format. Use registration ID (GRW-XXX-YYYY) or certificate number.'
                    });
                }
            }
            catch (queryError) {
                console.error('❌ Database query error:', queryError);
                console.timeEnd('⚡ OPTIMIZED Student Verification');
                return res.status(500).json({
                    success: false,
                    message: 'Database error occurred during verification'
                });
            }
            console.timeEnd('⚡ OPTIMIZED Student Verification');
            if (!student) {
                console.log(`🔍 Student not found with identifier: ${identifier}`);
                const notFoundResult = {
                    success: false,
                    message: 'No student found with the provided identifier'
                };
                verificationCache.set(cacheKey, {
                    data: notFoundResult,
                    timestamp: Date.now()
                });
                return res.status(404).json(notFoundResult);
            }
            console.log(`✅ Student found: ${student.registrationId} (${student.fullName})`);
            let documents = [];
            if (student.registrationId) {
                try {
                    console.time('⚡ Document URLs Generation');
                    const documentService = new document_service_1.DocumentService();
                    documents = await documentService.getDocumentsByRegistrationId(student.registrationId);
                    console.timeEnd('⚡ Document URLs Generation');
                    console.log(`📄 Generated URLs for ${documents.length} documents`);
                }
                catch (error) {
                    console.warn('⚠️ Could not fetch documents with presigned URLs for verification:', error.message);
                    documents = [];
                }
            }
            const verificationResult = {
                success: true,
                student: {
                    ...student,
                    documents
                }
            };
            verificationCache.set(cacheKey, {
                data: verificationResult,
                timestamp: Date.now()
            });
            console.log(`⚡ Verification completed for ${student.registrationId} - Performance optimized!`);
            return res.json(verificationResult);
        }
        catch (error) {
            console.error('❌ Verification error:', error);
            return res.status(500).json({
                success: false,
                message: 'An error occurred while verifying the certificate'
            });
        }
    }
    static clearCache() {
        verificationCache.clear();
        console.log('🗑️ Verification cache cleared');
    }
    static getCacheStats() {
        return {
            size: verificationCache.size,
            entries: Array.from(verificationCache.keys())
        };
    }
}
exports.OptimizedVerificationController = OptimizedVerificationController;
exports.default = OptimizedVerificationController;
//# sourceMappingURL=verification.controller.optimized.js.map