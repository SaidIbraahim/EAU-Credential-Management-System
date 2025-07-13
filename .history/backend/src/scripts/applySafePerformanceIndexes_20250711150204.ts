import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Apply Safe Performance-Critical Database Indexes
 * Avoiding functions in predicates that require IMMUTABLE marking
 */
async function applySafePerformanceIndexes() {
  console.log('🎯 APPLYING SAFE PERFORMANCE-CRITICAL DATABASE INDEXES');
  console.log('====================================================\n');
  
  const startTime = performance.now();
  
  try {
    console.log('📊 Creating safe indexes based on baseline performance analysis...\n');

    // 1. CRITICAL: User Login Optimization (642ms → target <100ms)
    console.log('🔐 1. USER AUTHENTICATION INDEXES...');
    
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_lookup 
      ON users(email) WHERE is_active = true;
    `;
    console.log('   ✅ Active user email lookup index');

    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_auth_data 
      ON users(email, password_hash, role, is_active);
    `;
    console.log('   ✅ Complete auth data index');

    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_last_login_desc 
      ON users(last_login DESC);
    `;
    console.log('   ✅ Last login tracking index\n');

    // 2. CRITICAL: Student List Optimization (913ms → target <200ms)
    console.log('🎓 2. STUDENT LIST PERFORMANCE INDEXES...');
    
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_list_created 
      ON students(created_at DESC);
    `;
    console.log('   ✅ Student creation date index');

    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_department_faculty 
      ON students(department_id, faculty_id, academic_year_id);
    `;
    console.log('   ✅ Student relations index');

    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_registration_id 
      ON students(registration_id);
    `;
    console.log('   ✅ Registration ID index');

    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_certificate_id 
      ON students(certificate_id) WHERE certificate_id IS NOT NULL;
    `;
    console.log('   ✅ Certificate ID index');

    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_name_search 
      ON students(full_name);
    `;
    console.log('   ✅ Name search index\n');

    // 3. SLOW: Audit Log Optimization (527ms → target <200ms)
    console.log('📋 3. AUDIT LOG PERFORMANCE INDEXES...');
    
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_timestamp_desc 
      ON audit_logs(timestamp DESC);
    `;
    console.log('   ✅ Audit log timeline index');

    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_timestamp 
      ON audit_logs(user_id, timestamp DESC);
    `;
    console.log('   ✅ User activity timeline index');

    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_action 
      ON audit_logs(action, timestamp DESC);
    `;
    console.log('   ✅ Action filtering index\n');

    // 4. SLOW: Dashboard Stats Optimization (310ms → target <150ms)
    console.log('📊 4. DASHBOARD STATISTICS INDEXES...');
    
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_gender_status 
      ON students(gender, status);
    `;
    console.log('   ✅ Gender and status analytics index');

    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_department_gpa 
      ON students(department_id, gpa);
    `;
    console.log('   ✅ Department GPA index');

    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_graduation_date 
      ON students(graduation_date) WHERE graduation_date IS NOT NULL;
    `;
    console.log('   ✅ Graduation date index\n');

    // 5. SLOW: User Management Optimization (327ms → target <100ms)
    console.log('👥 5. USER MANAGEMENT INDEXES...');
    
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role_status 
      ON users(role, is_active);
    `;
    console.log('   ✅ Role and status index');

    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_desc 
      ON users(created_at DESC);
    `;
    console.log('   ✅ User creation date index\n');

    // 6. Academic Configuration Indexes
    console.log('🎓 6. ACADEMIC CONFIGURATION INDEXES...');
    
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_departments_faculty_id 
      ON departments(faculty_id);
    `;
    console.log('   ✅ Department-faculty relationship index');

    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_academic_years_active 
      ON academic_years(is_active, academic_year);
    `;
    console.log('   ✅ Academic years index\n');

    // 7. Document Management Indexes
    console.log('📄 7. DOCUMENT MANAGEMENT INDEXES...');
    
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_student_reg_id 
      ON documents(student_registration_id);
    `;
    console.log('   ✅ Document by student registration index');

    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_type 
      ON documents(document_type, upload_date DESC);
    `;
    console.log('   ✅ Document type and date index\n');

    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('🎉 SAFE PERFORMANCE INDEXES APPLIED SUCCESSFULLY!');
    console.log('===============================================');
    console.log(`⏱️  Total time: ${duration} seconds`);
    console.log('📊 Expected Performance Improvements:');
    console.log('   🔐 User Login: 642ms → ~100-150ms (75% improvement)');
    console.log('   🎓 Student List: 913ms → ~200-300ms (65% improvement)');
    console.log('   📋 Audit Logs: 527ms → ~150-250ms (60% improvement)');
    console.log('   📊 Dashboard: 310ms → ~100-200ms (50% improvement)');
    console.log('   👥 User Management: 327ms → ~80-120ms (70% improvement)');
    console.log('\n✅ Ready for performance comparison testing!\n');

    console.log('🔄 NEXT STEPS:');
    console.log('1. Run performance comparison: npx ts-node src/scripts/runPerformanceBaseline.ts');
    console.log('2. If results are good, proceed to query optimization');
    console.log('3. Test frontend functionality to ensure no regressions\n');

  } catch (error) {
    console.error('❌ Error applying safe performance indexes:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  applySafePerformanceIndexes()
    .then(() => {
      console.log('🚀 Safe index optimization complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Safe index optimization failed:', error);
      process.exit(1);
    });
}

export default applySafePerformanceIndexes; 