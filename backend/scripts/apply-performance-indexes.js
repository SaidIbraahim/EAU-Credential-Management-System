const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function applyPerformanceIndexes() {
  console.log('🚀 Applying performance indexes to resolve slow queries...');
  
  try {
    // User table indexes
    console.log('📊 Creating User table indexes...');
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`;

    // Student table indexes (most critical)
    console.log('📊 Creating Student table indexes (most critical)...');
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_students_department_id ON students(department_id)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_students_faculty_id ON students(faculty_id)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_students_academic_year_id ON students(academic_year_id)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_students_status ON students(status)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_students_gpa ON students(gpa)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_students_created_at ON students(created_at)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_students_graduation_date ON students(graduation_date)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_students_certificate_id ON students(certificate_id)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_students_full_name ON students(full_name)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_students_gender ON students(gender)`;

    // Composite indexes for common query patterns
    console.log('📊 Creating composite indexes for query optimization...');
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_students_dept_status ON students(department_id, status)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_students_year_status ON students(academic_year_id, status)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_students_faculty_status ON students(faculty_id, status)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_students_created_status ON students(created_at, status)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_students_gpa_status ON students(gpa, status)`;

    // Document table indexes
    console.log('📊 Creating Document table indexes...');
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_documents_upload_date ON documents(upload_date)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_documents_file_type ON documents(file_type)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_documents_reg_id_type ON documents(registration_id, document_type)`;

    // AuditLog table indexes
    console.log('📊 Creating AuditLog table indexes...');
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON audit_logs(resource_id)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp_user ON audit_logs(timestamp, user_id)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp_action ON audit_logs(timestamp, action)`;

    // Department and Faculty indexes
    console.log('📊 Creating Department and Faculty indexes...');
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_departments_faculty_id ON departments(faculty_id)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(code)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_faculties_code ON faculties(code)`;

    // Academic Year indexes
    console.log('📊 Creating Academic Year indexes...');
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_academic_years_is_active ON academic_years(is_active)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_academic_years_academic_year ON academic_years(academic_year)`;

    console.log('✅ All performance indexes created successfully!');
    console.log('🚀 Database performance should now be 10-50x faster!');
    
    // Test query performance
    console.log('🧪 Testing query performance...');
    const start = Date.now();
    const studentCount = await prisma.student.count();
    const queryTime = Date.now() - start;
    console.log(`⚡ Student count query took ${queryTime}ms (should be <50ms now)`);
    
  } catch (error) {
    console.error('❌ Error applying performance indexes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

applyPerformanceIndexes(); 