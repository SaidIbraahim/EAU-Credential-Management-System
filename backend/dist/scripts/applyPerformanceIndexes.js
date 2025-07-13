"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function applyPerformanceIndexes() {
    console.log('🎯 APPLYING PERFORMANCE-CRITICAL DATABASE INDEXES');
    console.log('=================================================\n');
    const startTime = performance.now();
    try {
        console.log('📊 Creating indexes based on baseline performance analysis...\n');
        console.log('🔐 1. USER AUTHENTICATION INDEXES...');
        await prisma.$executeRaw `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_active 
      ON users(email, is_active) 
      WHERE is_active = true;
    `;
        console.log('   ✅ Active user email lookup index');
        await prisma.$executeRaw `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_hash 
      ON users(email) 
      INCLUDE (password_hash, role, is_active);
    `;
        console.log('   ✅ Email with auth data include index');
        await prisma.$executeRaw `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_last_login 
      ON users(last_login DESC) 
      WHERE is_active = true;
    `;
        console.log('   ✅ Last login tracking index\n');
        console.log('🎓 2. STUDENT LIST PERFORMANCE INDEXES...');
        await prisma.$executeRaw `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_list_optimized 
      ON students(created_at DESC, department_id, faculty_id) 
      INCLUDE (registration_id, full_name, status);
    `;
        console.log('   ✅ Student list with relations index');
        await prisma.$executeRaw `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_registration_id_upper 
      ON students(UPPER(registration_id));
    `;
        console.log('   ✅ Case-insensitive registration ID index');
        await prisma.$executeRaw `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_certificate_id_active 
      ON students(certificate_id) 
      WHERE certificate_id IS NOT NULL;
    `;
        console.log('   ✅ Certificate ID lookup index');
        await prisma.$executeRaw `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_search_gin 
      ON students USING gin(to_tsvector('english', full_name || ' ' || registration_id));
    `;
        console.log('   ✅ Full-text search index\n');
        console.log('📋 3. AUDIT LOG PERFORMANCE INDEXES...');
        await prisma.$executeRaw `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_performance 
      ON audit_logs(timestamp DESC, user_id) 
      INCLUDE (action, resource_type, details);
    `;
        console.log('   ✅ Audit log timeline with user index');
        await prisma.$executeRaw `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_recent 
      ON audit_logs(timestamp DESC) 
      WHERE timestamp > NOW() - INTERVAL '7 days';
    `;
        console.log('   ✅ Recent activity index');
        await prisma.$executeRaw `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_action_filter 
      ON audit_logs(action, timestamp DESC);
    `;
        console.log('   ✅ Action filtering index\n');
        console.log('📊 4. DASHBOARD STATISTICS INDEXES...');
        await prisma.$executeRaw `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_analytics 
      ON students(gender, status, department_id) 
      INCLUDE (gpa, graduation_date, certificate_id);
    `;
        console.log('   ✅ Student analytics index');
        await prisma.$executeRaw `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_department_stats 
      ON students(department_id) 
      INCLUDE (gpa, status, gender);
    `;
        console.log('   ✅ Department statistics index');
        await prisma.$executeRaw `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_graduation_trends 
      ON students(graduation_date DESC) 
      WHERE graduation_date IS NOT NULL;
    `;
        console.log('   ✅ Graduation trends index\n');
        console.log('👥 5. USER MANAGEMENT INDEXES...');
        await prisma.$executeRaw `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_management 
      ON users(role, is_active, created_at DESC) 
      INCLUDE (email, last_login);
    `;
        console.log('   ✅ User management index');
        await prisma.$executeRaw `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role_active 
      ON users(role) 
      WHERE is_active = true;
    `;
        console.log('   ✅ Active user role index\n');
        console.log('🎓 6. ACADEMIC CONFIGURATION INDEXES...');
        await prisma.$executeRaw `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_departments_faculty 
      ON departments(faculty_id, name) 
      INCLUDE (code, description);
    `;
        console.log('   ✅ Department-faculty relationship index');
        await prisma.$executeRaw `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_academic_years_active 
      ON academic_years(is_active DESC, academic_year) 
      WHERE is_active = true;
    `;
        console.log('   ✅ Active academic years index\n');
        console.log('📄 7. DOCUMENT MANAGEMENT INDEXES...');
        await prisma.$executeRaw `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_student_reg 
      ON documents(student_registration_id, document_type) 
      INCLUDE (file_name, file_url, upload_date);
    `;
        console.log('   ✅ Document by student registration index');
        await prisma.$executeRaw `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_type_date 
      ON documents(document_type, upload_date DESC);
    `;
        console.log('   ✅ Document type and date index\n');
        const endTime = performance.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        console.log('🎉 PERFORMANCE INDEXES APPLIED SUCCESSFULLY!');
        console.log('===========================================');
        console.log(`⏱️  Total time: ${duration} seconds`);
        console.log('📊 Expected Performance Improvements:');
        console.log('   🔐 User Login: 642ms → ~80-120ms (80% improvement)');
        console.log('   🎓 Student List: 913ms → ~150-250ms (75% improvement)');
        console.log('   📋 Audit Logs: 527ms → ~100-200ms (70% improvement)');
        console.log('   📊 Dashboard: 310ms → ~80-150ms (60% improvement)');
        console.log('   👥 User Management: 327ms → ~60-100ms (75% improvement)');
        console.log('\n✅ Ready for performance comparison testing!\n');
    }
    catch (error) {
        console.error('❌ Error applying performance indexes:', error);
        throw error;
    }
    finally {
        await prisma.$disconnect();
    }
}
if (require.main === module) {
    applyPerformanceIndexes()
        .then(() => {
        console.log('🚀 Index optimization complete! Run performance tests to measure improvements.');
        process.exit(0);
    })
        .catch((error) => {
        console.error('💥 Index optimization failed:', error);
        process.exit(1);
    });
}
exports.default = applyPerformanceIndexes;
//# sourceMappingURL=applyPerformanceIndexes.js.map