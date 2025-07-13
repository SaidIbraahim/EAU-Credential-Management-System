import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Apply Performance-Critical Database Indexes
 * Based on baseline analysis showing:
 * - User Login Query: 642ms (CRITICAL)
 * - Student List Query: 913ms (CRITICAL) 
 * - Audit Log Query: 527ms (SLOW)
 * - Dashboard Stats: 310ms (SLOW)
 * - User Management: 327ms (SLOW)
 */
async function applyPerformanceIndexes() {
  console.log('🎯 APPLYING PERFORMANCE-CRITICAL DATABASE INDEXES');
  console.log('=================================================\n');
  
  const startTime = performance.now();
  
  try {
    console.log('📊 Creating indexes based on baseline performance analysis...\n');

    // 1. CRITICAL: User Login Optimization (642ms → target <100ms)
    console.log('🔐 1. USER AUTHENTICATION INDEXES...');
    
    // Primary login lookup - most critical
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_active 
      ON users(email, is_active) 
      WHERE is_active = true;
    `;
    console.log('   ✅ Active user email lookup index');

    // Login performance boost
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_hash 
      ON users(email) 
      INCLUDE (password_hash, role, is_active);
    `;
    console.log('   ✅ Email with auth data include index');

    // Session updates optimization
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_last_login 
      ON users(last_login DESC) 
      WHERE is_active = true;
    `;
    console.log('   ✅ Last login tracking index\n');

    // 2. CRITICAL: Student List Optimization (913ms → target <200ms)
    console.log('🎓 2. STUDENT LIST PERFORMANCE INDEXES...');
    
    // Primary student listing with relations
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_list_optimized 
      ON students(created_at DESC, department_id, faculty_id) 
      INCLUDE (registration_id, full_name, status);
    `;
    console.log('   ✅ Student list with relations index');

    // Registration ID lookups (for verification)
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_registration_id_upper 
      ON students(UPPER(registration_id));
    `;
    console.log('   ✅ Case-insensitive registration ID index');

    // Certificate ID lookups (for verification) 
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_certificate_id_active 
      ON students(certificate_id) 
      WHERE certificate_id IS NOT NULL;
    `;
    console.log('   ✅ Certificate ID lookup index');

    // Search optimization for student list
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_search_gin 
      ON students USING gin(to_tsvector('english', full_name || ' ' || registration_id));
    `;
    console.log('   ✅ Full-text search index\n');

    // 3. SLOW: Audit Log Optimization (527ms → target <200ms)
    console.log('📋 3. AUDIT LOG PERFORMANCE INDEXES...');
    
    // Primary audit log queries with user relations
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_performance 
      ON audit_logs(timestamp DESC, user_id) 
      INCLUDE (action, resource_type, details);
    `;
    console.log('   ✅ Audit log timeline with user index');

    // Recent activity queries (admin dashboard)
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_recent 
      ON audit_logs(timestamp DESC) 
      WHERE timestamp > NOW() - INTERVAL '7 days';
    `;
    console.log('   ✅ Recent activity index');

    // Action filtering
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_action_filter 
      ON audit_logs(action, timestamp DESC);
    `;
    console.log('   ✅ Action filtering index\n');

    // 4. SLOW: Dashboard Stats Optimization (310ms → target <150ms)
    console.log('📊 4. DASHBOARD STATISTICS INDEXES...');
    
    // Student counting and analytics
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_analytics 
      ON students(gender, status, department_id) 
      INCLUDE (gpa, graduation_date, certificate_id);
    `;
    console.log('   ✅ Student analytics index');

    // Department performance analytics
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_department_stats 
      ON students(department_id) 
      INCLUDE (gpa, status, gender);
    `;
    console.log('   ✅ Department statistics index');

    // Graduation trends
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_graduation_trends 
      ON students(graduation_date DESC) 
      WHERE graduation_date IS NOT NULL;
    `;
    console.log('   ✅ Graduation trends index\n');

    // 5. SLOW: User Management Optimization (327ms → target <100ms)
    console.log('👥 5. USER MANAGEMENT INDEXES...');
    
    // Admin user management queries
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_management 
      ON users(role, is_active, created_at DESC) 
      INCLUDE (email, last_login);
    `;
    console.log('   ✅ User management index');

    // Role-based queries
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role_active 
      ON users(role) 
      WHERE is_active = true;
    `;
    console.log('   ✅ Active user role index\n');

    // 6. ADDITIONAL: Academic Configuration Indexes
    console.log('🎓 6. ACADEMIC CONFIGURATION INDEXES...');
    
    // Department-faculty relationships
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_departments_faculty 
      ON departments(faculty_id, name) 
      INCLUDE (code, description);
    `;
    console.log('   ✅ Department-faculty relationship index');

    // Active academic years
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_academic_years_active 
      ON academic_years(is_active DESC, academic_year) 
      WHERE is_active = true;
    `;
    console.log('   ✅ Active academic years index\n');

    // 7. DOCUMENT PERFORMANCE INDEXES
    console.log('📄 7. DOCUMENT MANAGEMENT INDEXES...');
    
    // Document lookup by student registration
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_student_reg 
      ON documents(student_registration_id, document_type) 
      INCLUDE (file_name, file_url, upload_date);
    `;
    console.log('   ✅ Document by student registration index');

    // Document type filtering
    await prisma.$executeRaw`
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

  } catch (error) {
    console.error('❌ Error applying performance indexes:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
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

export default applyPerformanceIndexes; 