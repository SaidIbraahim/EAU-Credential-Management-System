# EAU Credential System - Production Documentation

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Backend Architecture & Operations](#backend-architecture--operations)
4. [Database Schema Design](#database-schema-design)
5. [Admin Panel Functionality](#admin-panel-functionality)
6. [Verification Portal Workflow](#verification-portal-workflow)
7. [Deployment Guide](#deployment-guide)
8. [API Reference](#api-reference)
9. [Security & Performance](#security--performance)
10. [Troubleshooting](#troubleshooting)

---

## Executive Summary

The **EAU Credential System** is a comprehensive certificate verification and student management platform designed for East Africa University - Garowe Campus. The system provides a secure, scalable solution for managing student records, academic configurations, and certificate verification services.

### Key Features
- 🎓 **Student Management**: Complete CRUD operations with bulk import/export
- 📋 **Academic Configuration**: Departments, faculties, and academic years management
- 📄 **Document Management**: Secure file upload and storage with Cloudflare R2
- 🔍 **Certificate Verification**: Public portal for certificate authenticity verification
- 👥 **Role-based Access Control**: ADMIN and SUPER_ADMIN roles with granular permissions
- 📊 **Analytics Dashboard**: Real-time insights and reporting
- 🔐 **Audit Logging**: Comprehensive activity tracking and compliance
- 📱 **Responsive Design**: Mobile-first approach with modern UI

### Production URLs
- **Admin Panel**: https://eau-admin.vercel.app
- **Verification Portal**: https://eau-verify.vercel.app
- **Backend API**: https://eau-backend.vercel.app

---

## System Architecture

The EAU Credential System follows a modern microservices architecture with clear separation of concerns:

```mermaid
graph TB
    subgraph "Frontend Applications"
        A[Admin Panel<br/>React + TypeScript<br/>Port 5173] 
        V[Verification Portal<br/>React + TypeScript<br/>Port 5174]
    end
    
    subgraph "Backend Services"
        API[Express.js API Server<br/>Node.js + TypeScript<br/>Port 3000]
        Auth[Authentication Service<br/>JWT + Role-based Access]
        Doc[Document Service<br/>File Upload/Management]
        Ver[Verification Service<br/>Certificate Validation]
        Audit[Audit Service<br/>Activity Logging]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL Database<br/>Prisma ORM)]
        Storage[File Storage<br/>Cloudflare R2/Local]
    end
    
    subgraph "External Services"
        Email[Email Service<br/>Nodemailer/SMTP]
        CDN[Vercel CDN<br/>Static Assets]
    end
    
    A --> API
    V --> Ver
    API --> Auth
    API --> Doc
    API --> Audit
    Ver --> DB
    Auth --> DB
    Doc --> Storage
    Doc --> DB
    Audit --> DB
    API --> Email
    A --> CDN
    V --> CDN
```

### Technology Stack

#### Frontend
- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 5.4.1
- **Styling**: Tailwind CSS 3.4.11 with shadcn/ui components
- **State Management**: TanStack Query v5.56.2
- **Routing**: React Router DOM v6.26.2
- **Form Handling**: React Hook Form v7.53.0 with Zod validation

#### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js with optimized middleware stack
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with role-based access control
- **File Storage**: Cloudflare R2 with presigned URLs
- **Security**: Helmet, CORS, input validation

#### Infrastructure
- **Hosting**: Vercel for both frontend and backend
- **Database**: PostgreSQL (production-ready with indexing)
- **CDN**: Vercel Edge Network
- **Monitoring**: Custom performance monitoring and logging

---

## Backend Architecture & Operations

### Server Structure

The backend follows a modular architecture with clear separation of concerns:

```
backend/src/
├── controllers/          # Request handlers and business logic
├── services/            # Business logic and external integrations
├── routes/              # API route definitions
├── middleware/          # Authentication, validation, logging
├── lib/                 # Database connection and utilities
├── validators/          # Input validation schemas
├── types/               # TypeScript type definitions
├── config/              # Environment and app configuration
└── utils/               # Helper functions and utilities
```

### Key Services

#### 1. Authentication Service
- JWT token-based authentication
- Role-based access control (ADMIN, SUPER_ADMIN)
- Session management and token refresh
- Password reset functionality

#### 2. Document Service
- Secure file upload to Cloudflare R2
- Presigned URL generation for secure access
- File type validation and size limits
- Document categorization (photo, transcript, certificate, supporting)

#### 3. Verification Service
- High-performance certificate lookup
- Caching layer for frequently accessed records
- Support for registration ID and certificate number verification
- Optimized database queries with indexes

#### 4. Audit Service
- Comprehensive activity logging
- IP address and user agent tracking
- Resource-level audit trails
- Compliance reporting

### Performance Optimizations

- **Database Indexing**: 13+ strategic indexes for sub-200ms query times
- **Caching**: In-memory caching for verification results
- **Query Optimization**: Raw SQL for dashboard analytics
- **Parallel Processing**: Async document uploads
- **Middleware Ordering**: Performance-critical endpoints first

---

## Database Schema Design

### Entity Relationship Diagram

The database schema is designed for optimal performance and data integrity:

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(20) DEFAULT 'ADMIN' CHECK (role IN ('ADMIN', 'SUPER_ADMIN')),
    is_active BOOLEAN DEFAULT true,
    must_change_password BOOLEAN DEFAULT false,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Students Table (Core Entity)
```sql
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    registration_id VARCHAR(50) UNIQUE NOT NULL,
    certificate_id VARCHAR(50) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('MALE', 'FEMALE')),
    phone VARCHAR(255),
    department_id INTEGER REFERENCES departments(id),
    faculty_id INTEGER REFERENCES faculties(id),
    academic_year_id INTEGER REFERENCES academic_years(id),
    gpa DECIMAL(3,2),
    grade VARCHAR(5),
    graduation_date DATE,
    status VARCHAR(20) DEFAULT 'UN_CLEARED' CHECK (status IN ('CLEARED', 'UN_CLEARED')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Relationships

1. **One-to-Many**: Faculty → Departments
2. **One-to-Many**: Department → Students
3. **One-to-Many**: Academic Year → Students
4. **One-to-Many**: Student → Documents
5. **One-to-Many**: User → Audit Logs

### Indexing Strategy

Performance-critical indexes for sub-200ms query times:

```sql
-- Primary lookups for verification
CREATE INDEX idx_students_registration_id ON students(registration_id);
CREATE INDEX idx_students_certificate_id ON students(certificate_id);

-- Dashboard queries
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_created_at ON students(created_at);
CREATE INDEX idx_students_department_status ON students(department_id, status);

-- Search and filtering
CREATE INDEX idx_students_full_name ON students(full_name);
CREATE INDEX idx_students_graduation_date ON students(graduation_date);
```

---

## Admin Panel Functionality

### User Roles & Access Control

#### ADMIN Role
- Student record management (CRUD operations)
- Document upload and management
- Academic configuration viewing
- Reports and analytics access
- Own profile management

#### SUPER_ADMIN Role
- All ADMIN permissions
- User management (create, edit, delete admins)
- System configuration
- Academic configuration management
- Audit log access
- Bulk operations approval

### Core Features

#### 1. Dashboard
- **Real-time Statistics**: Total students, cleared/uncleared counts
- **Performance Metrics**: Recent registrations, graduation trends
- **Quick Actions**: Add student, bulk import, generate reports
- **Visual Analytics**: Charts and graphs for data insights

#### 2. Student Management
- **Student List**: Paginated table with search and filtering
- **Bulk Import**: CSV and ZIP file upload with validation
- **Individual Records**: Detailed student profiles with documents
- **Status Management**: Clear/unclear status updates
- **Document Handling**: Upload and manage student documents

#### 3. Academic Configuration
- **Departments**: Create and manage academic departments
- **Faculties**: Faculty organization and hierarchy
- **Academic Years**: Session management and activation

#### 4. Document Management
- **Secure Upload**: Cloudflare R2 integration
- **File Validation**: Type and size restrictions
- **Document Types**: Photo, transcript, certificate, supporting
- **Preview System**: Secure document viewing

#### 5. Reports & Analytics
- **Student Reports**: Detailed analytics by department, year, status
- **Export Functionality**: CSV, PDF export options
- **Custom Filters**: Date ranges, departments, status filters
- **Performance Metrics**: System usage and response times

#### 6. Audit Logging
- **Activity Tracking**: All user actions logged
- **Resource Monitoring**: Track changes to critical data
- **Compliance Reports**: Generate audit trails
- **Security Monitoring**: Failed login attempts, unauthorized access

### Navigation Structure

```
Admin Panel
├── Dashboard (Overview & Analytics)
├── Students
│   ├── Student List
│   ├── Add Student
│   ├── Bulk Import
│   └── Student Details
├── Academic Configuration
│   ├── Departments
│   ├── Faculties
│   └── Academic Years
├── Reports
│   ├── Student Reports
│   ├── Analytics
│   └── Export Tools
├── Audit Logs
│   ├── Activity Log
│   ├── Security Events
│   └── Compliance Reports
└── Settings
    ├── Profile Management
    ├── User Management (SUPER_ADMIN)
    └── System Configuration
```

---

## Verification Portal Workflow

### Public Certificate Verification

The verification portal provides a streamlined interface for certificate authenticity checking:

#### 1. Search Interface
- **Input Methods**: Registration ID (GRW-XXX-YYYY) or Certificate Number
- **Validation**: Real-time input validation and formatting
- **Search Optimization**: Cached results for improved performance

#### 2. Verification Process

```mermaid
sequenceDiagram
    participant User
    participant Portal
    participant API
    participant Database
    participant Cache

    User->>Portal: Enter identifier
    Portal->>Portal: Validate input format
    Portal->>API: POST /api/verify/:identifier
    API->>Cache: Check cache
    alt Cache Hit
        Cache->>API: Return cached result
    else Cache Miss
        API->>Database: Query student record
        Database->>API: Return student data
        API->>Cache: Store result
    end
    API->>Portal: Return verification result
    Portal->>User: Display certificate details
```

#### 3. Verification Results

**Successful Verification Display**:
- Student full name and photo
- Registration ID and certificate number
- Department and faculty information
- Academic year and graduation date
- GPA and grade information
- Verification timestamp
- Official EAU branding and security features

**Failed Verification**:
- Clear error messages
- Suggestions for correct format
- Contact information for support

#### 4. Print & Export Features
- **Print Optimization**: Dedicated print stylesheet
- **Mobile Support**: Enhanced Android/Samsung device compatibility
- **PDF Generation**: Browser-native PDF export
- **Security Features**: Watermarks and verification codes

### Performance Characteristics

- **Average Response Time**: <200ms for cached results
- **Cache Duration**: 1 minute for verification results
- **Uptime Target**: 99.9% availability
- **Mobile Performance**: Optimized for 3G networks

---

## Deployment Guide

### Production Environment Setup

#### Prerequisites
- Node.js 18+ installed
- PostgreSQL database
- Cloudflare R2 storage account
- Vercel account for deployment

#### Environment Variables

**Backend (.env)**:
```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# Authentication
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-refresh-secret"

# File Storage (Cloudflare R2)
R2_ENDPOINT="your-r2-endpoint"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_BUCKET_NAME="your-bucket-name"

# Email Configuration
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-email@example.com"
SMTP_PASS="your-password"

# CORS Origins
CORS_ORIGIN="https://eau-admin.vercel.app,https://eau-verify.vercel.app"
```

**Frontend (.env)**:
```env
VITE_API_URL="https://eau-backend.vercel.app"
```

#### Deployment Steps

1. **Database Setup**:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

2. **Backend Deployment**:
   ```bash
   cd backend
   npm install
   npm run build
   vercel --prod
   ```

3. **Frontend Deployment**:
   ```bash
   cd apps/admin
   npm install
   npm run build
   vercel --prod
   
   cd ../verify
   npm install
   npm run build
   vercel --prod
   ```

---

## API Reference

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login` | User login | No |
| POST | `/api/auth/logout` | User logout | Yes |
| GET | `/api/auth/profile` | Get user profile | Yes |
| POST | `/api/auth/change-password` | Change password | Yes |

### Student Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/students` | List students with pagination | Yes |
| GET | `/api/students/:id` | Get student details | Yes |
| POST | `/api/students` | Create new student | Yes |
| PUT | `/api/students/:id` | Update student | Yes |
| DELETE | `/api/students/:id` | Delete student | Yes |
| POST | `/api/students/bulk-import` | Bulk import students | Yes |

### Verification

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/verify/:identifier` | Verify certificate | No |
| GET | `/health` | API health check | No |

### Academic Configuration

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/departments` | List departments | Yes |
| POST | `/api/departments` | Create department | Yes (SUPER_ADMIN) |
| GET | `/api/faculties` | List faculties | Yes |
| POST | `/api/faculties` | Create faculty | Yes (SUPER_ADMIN) |
| GET | `/api/academic-years` | List academic years | Yes |
| POST | `/api/academic-years` | Create academic year | Yes (SUPER_ADMIN) |

---

## Security & Performance

### Security Measures

#### Authentication & Authorization
- JWT token-based authentication with secure secrets
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Session invalidation on logout
- Automatic token refresh mechanism

#### Input Validation
- Zod schema validation for all inputs
- SQL injection prevention with Prisma ORM
- XSS protection with input sanitization
- File upload restrictions and validation

#### Infrastructure Security
- HTTPS enforcement for all communications
- CORS configuration for approved origins only
- Helmet.js for security headers
- Rate limiting for API endpoints
- Audit logging for security monitoring

### Performance Optimizations

#### Database Performance
- **13+ Strategic Indexes**: Optimized for common queries
- **Query Optimization**: Raw SQL for complex analytics
- **Connection Pooling**: Efficient database connections
- **Selective Querying**: Only fetch required fields

#### Caching Strategy
- **Verification Cache**: 1-minute TTL for certificate lookups
- **Dashboard Cache**: Optimized for real-time analytics
- **CDN Caching**: Static assets cached at edge

#### Frontend Optimizations
- **Code Splitting**: Lazy loading for components
- **Bundle Optimization**: Tree shaking and minification
- **Image Optimization**: WebP format with fallbacks
- **Skeleton Loading**: Enhanced user experience

### Performance Targets

| Component | Target Response Time | Current Performance |
|-----------|---------------------|-------------------|
| Dashboard | <200ms | ~150ms |
| Verification | <300ms | ~180ms |
| Document Upload | <5s | ~3.2s |
| Student Search | <150ms | ~120ms |
| Bulk Import | <30s | ~25s |

---

## Troubleshooting

### Common Issues

#### Authentication Issues
```bash
# Clear browser cache and localStorage
localStorage.clear();
location.reload();
```

#### Database Connection Issues
```bash
# Test database connection
npx prisma db push --preview-feature
```

#### File Upload Issues
```bash
# Check Cloudflare R2 configuration
curl -X GET "https://your-r2-endpoint/bucket-name"
```

### Monitoring & Logging

#### Backend Logs
- Located in `/backend/logs/` directory
- Structured JSON logging with timestamps
- Error tracking with stack traces
- Performance monitoring included

#### Error Handling
- Graceful error recovery
- User-friendly error messages
- Automatic retry mechanisms
- Fallback procedures for critical operations

### Support Contacts

- **Technical Support**: tech-support@eau.edu.so
- **System Administrator**: admin@eau.edu.so
- **Emergency Contact**: +252-XX-XXXXXXX

---

## Conclusion

The EAU Credential System represents a modern, scalable solution for academic credential management and verification. With its robust architecture, comprehensive security measures, and optimized performance, the system is ready for production use and can scale to handle growing institutional needs.

For additional support or feature requests, please contact the development team or create an issue in the project repository.

---

*Last Updated: June 17th 2025*
*Version: 1.0.0*
*Status: Production Ready*
