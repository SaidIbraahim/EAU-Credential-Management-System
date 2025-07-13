-- ⚡ PERFORMANCE OPTIMIZATION INDEXES
-- This migration adds strategic indexes to improve query performance

-- 🎯 STUDENTS TABLE INDEXES
-- Primary search and filtering indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_students_registration_id" ON "Student" ("registrationId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_students_certificate_id" ON "Student" ("certificateId") WHERE "certificateId" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_students_full_name" ON "Student" ("fullName");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_students_status" ON "Student" ("status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_students_created_at" ON "Student" ("createdAt" DESC);

-- Compound indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_students_status_created" ON "Student" ("status", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_students_dept_faculty" ON "Student" ("departmentId", "facultyId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_students_search_composite" ON "Student" ("fullName", "registrationId", "status");

-- Foreign key indexes for joins
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_students_department_id" ON "Student" ("departmentId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_students_faculty_id" ON "Student" ("facultyId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_students_academic_year_id" ON "Student" ("academicYearId");

-- 📄 DOCUMENTS TABLE INDEXES
-- Core document queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_documents_registration_id" ON "Document" ("registrationId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_documents_type" ON "Document" ("documentType");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_documents_upload_date" ON "Document" ("uploadDate" DESC);

-- Compound indexes for document filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_documents_student_type" ON "Document" ("registrationId", "documentType");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_documents_type_date" ON "Document" ("documentType", "uploadDate" DESC);

-- 📊 AUDIT LOG INDEXES
-- Audit log performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_audit_timestamp" ON "AuditLog" ("timestamp" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_audit_action" ON "AuditLog" ("action");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_audit_user_id" ON "AuditLog" ("userId") WHERE "userId" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_audit_resource_type" ON "AuditLog" ("resourceType") WHERE "resourceType" IS NOT NULL;

-- Compound indexes for audit queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_audit_action_timestamp" ON "AuditLog" ("action", "timestamp" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_audit_user_timestamp" ON "AuditLog" ("userId", "timestamp" DESC) WHERE "userId" IS NOT NULL;

-- 👥 USER TABLE INDEXES
-- User authentication and management
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_email" ON "User" ("email");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_active" ON "User" ("isActive") WHERE "isActive" = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_role" ON "User" ("role");

-- 🏢 ACADEMIC STRUCTURE INDEXES
-- Department and faculty lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_departments_name" ON "Department" ("name");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_departments_code" ON "Department" ("code");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_faculties_name" ON "Faculty" ("name");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_faculties_code" ON "Faculty" ("code");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_academic_years_year" ON "AcademicYear" ("academicYear");

-- 🔍 FULL-TEXT SEARCH INDEXES (PostgreSQL specific)
-- Enable faster text search across multiple fields
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_students_fulltext" ON "Student" 
  USING gin(to_tsvector('english', coalesce("fullName", '') || ' ' || coalesce("registrationId", '') || ' ' || coalesce("certificateId", '')));

-- 📈 REPORTING AGGREGATION INDEXES
-- Specialized indexes for reporting queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_students_reporting" ON "Student" ("status", "departmentId", "facultyId", "createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_documents_reporting" ON "Document" ("documentType", "uploadDate", "registrationId");

-- 🎯 PARTIAL INDEXES for common filters
-- Only index active/relevant records
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_students_active" ON "Student" ("createdAt" DESC) WHERE "status" = 'CLEARED';
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_students_pending" ON "Student" ("createdAt" DESC) WHERE "status" = 'UN_CLEARED';

-- 📊 STATISTICS UPDATE
-- Update table statistics for query planner
ANALYZE "Student";
ANALYZE "Document";
ANALYZE "AuditLog";
ANALYZE "User";
ANALYZE "Department";
ANALYZE "Faculty";
ANALYZE "AcademicYear"; 