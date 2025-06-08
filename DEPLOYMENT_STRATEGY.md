# 🚀 EAU CREDENTIAL SYSTEM - DEPLOYMENT STRATEGY

**Target Architecture**: Multi-App Vercel Deployment with Custom Domains  
**Database**: PostgreSQL on Neon.tech  
**Storage**: Cloudflare R2  
**Version Control**: GitHub  

---

## 🏗️ DEPLOYMENT ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION DEPLOYMENT                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐         ┌──────────────────┐        │
│  │   Admin Panel    │         │ Verification     │        │
│  │ admin.eaugarowe  │◄────────┤    Portal        │        │
│  │    .edu.so       │         │ verify.eaugarowe │        │
│  │  (Vercel App 1)  │         │    .edu.so       │        │
│  └────────┬─────────┘         │  (Vercel App 2)  │        │
│           │                   └─────────┬────────┘        │
│           │                            │                  │
│           └─────────┬──────────────────┘                  │
│                     │                                     │
│              ┌──────▼──────┐                              │
│              │   Backend   │                              │
│              │   API       │                              │
│              │ (Vercel     │                              │
│              │ Functions)  │                              │
│              └──────┬──────┘                              │
│                     │                                     │
│       ┌─────────────┼─────────────┐                       │
│       │             │             │                       │
│  ┌────▼─────┐  ┌───▼───┐  ┌──────▼──────┐               │
│  │PostgreSQL│  │ Neon  │  │ Cloudflare  │               │
│  │Database  │  │.tech  │  │    R2       │               │
│  │          │  │       │  │  Storage    │               │
│  └──────────┘  └───────┘  └─────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 STEP-BY-STEP DEPLOYMENT GUIDE

### **PHASE 1: GITHUB REPOSITORY SETUP**

#### **1.1 Repository Preparation**
```bash
# Initialize Git if not already done
git init

# Add all files
git add .
git commit -m "feat: Initial commit - EAU Credential System production ready"

# Create GitHub repository (via GitHub CLI or web interface)
gh repo create eau-credential-system --public --description "EAU Credential Management System"

# Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/eau-credential-system.git
git branch -M main
git push -u origin main
```

#### **1.2 Branch Strategy**
```bash
# Create development branch
git checkout -b development
git push -u origin development

# Create staging branch
git checkout -b staging
git push -u origin staging

# Main branch = Production
# Staging branch = Pre-production testing  
# Development branch = Active development
```

### **PHASE 2: NEON.TECH DATABASE SETUP**

#### **2.1 Create Neon Database**
1. Visit [neon.tech](https://neon.tech)
2. Create account and new project: `eau-credential-system`
3. Database name: `eau_credentials_db`
4. Region: Choose closest to your users (EU/US)

#### **2.2 Database Configuration**
```sql
-- Run these commands in Neon SQL Editor
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Your existing Prisma schema will handle table creation
-- Just ensure the database is ready for Prisma migrations
```

#### **2.3 Connection String Format**
```env
# Neon provides this format:
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
```

### **PHASE 3: CLOUDFLARE R2 STORAGE SETUP**

#### **3.1 Create R2 Bucket**
1. Go to Cloudflare Dashboard → R2 Object Storage
2. Create bucket: `eau-documents-storage`
3. Configure CORS for file uploads:

```json
[
  {
    "AllowedOrigins": [
      "https://admin.eaugarowe.edu.so",
      "https://verify.eaugarowe.edu.so"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 86400
  }
]
```

#### **3.2 API Tokens**
Create R2 token with permissions:
- Object Read
- Object Write  
- Object Delete

### **PHASE 4: VERCEL DEPLOYMENT CONFIGURATION**

#### **4.1 Project Structure for Vercel**
Create these Vercel configuration files:

**Root Level** (`vercel.json`):
```json
{
  "version": 2,
  "build": {
    "env": {
      "NODE_VERSION": "18.x"
    }
  },
  "github": {
    "enabled": true,
    "autoAlias": true
  }
}
```

#### **4.2 Individual App Configurations**

**Admin App** (`apps/admin/vercel.json`):
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "env": {
    "NODE_VERSION": "18.x"
  }
}
```

**Verify App** (`apps/verify/vercel.json`):
```json
{
  "framework": "vite", 
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "env": {
    "NODE_VERSION": "18.x"
  }
}
```

**Backend API** (`backend/vercel.json`):
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "src/index.ts"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### **PHASE 5: ENVIRONMENT VARIABLES SETUP**

#### **5.1 Backend Environment Variables**
Set these in Vercel Dashboard → Settings → Environment Variables:

```env
# Database
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
DIRECT_URL="postgresql://username:password@host/database?sslmode=require"

# JWT & Security
JWT_SECRET="your-super-secure-jwt-secret-min-32-chars"
JWT_EXPIRES_IN="24h"
BCRYPT_ROUNDS=12

# Cloudflare R2 Storage
R2_ACCOUNT_ID="your-cloudflare-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_BUCKET_NAME="eau-documents-storage"
R2_PUBLIC_URL="https://eau-documents-storage.your-account.r2.cloudflarestorage.com"

# API Configuration
API_BASE_URL="https://eau-backend.vercel.app"
CORS_ORIGIN="https://admin.eaugarowe.edu.so,https://verify.eaugarowe.edu.so"

# Email Configuration (if using)
SMTP_HOST="your-smtp-host"
SMTP_PORT=587
SMTP_USER="your-smtp-user"
SMTP_PASS="your-smtp-password"
FROM_EMAIL="noreply@eaugarowe.edu.so"

# File Upload Limits
MAX_FILE_SIZE=10485760  # 10MB in bytes
ALLOWED_FILE_TYPES="image/jpeg,image/png,application/pdf"
```

#### **5.2 Frontend Environment Variables**

**Admin App** Environment Variables:
```env
VITE_API_BASE_URL="https://eau-backend.vercel.app"
VITE_APP_NAME="EAU Admin Panel"
VITE_MAX_FILE_SIZE=10485760
VITE_VERIFICATION_URL="https://verify.eaugarowe.edu.so"
```

**Verify App** Environment Variables:
```env
VITE_API_BASE_URL="https://eau-backend.vercel.app"
VITE_APP_NAME="EAU Certificate Verification"
VITE_ADMIN_URL="https://admin.eaugarowe.edu.so"
```

### **PHASE 6: VERCEL DEPLOYMENT COMMANDS**

#### **6.1 Install Vercel CLI**
```bash
npm install -g vercel
vercel login
```

#### **6.2 Deploy Each App Separately**

**Deploy Backend API:**
```bash
cd backend
vercel --prod
# Follow prompts to configure
```

**Deploy Admin Panel:**
```bash
cd apps/admin
vercel --prod
# Follow prompts to configure
```

**Deploy Verification Portal:**
```bash
cd apps/verify  
vercel --prod
# Follow prompts to configure
```

### **PHASE 7: CUSTOM DOMAIN CONFIGURATION**

#### **7.1 Domain Setup in Vercel**
1. Go to Vercel Dashboard → Project Settings → Domains
2. Add domains:
   - `admin.eaugarowe.edu.so` → Admin Panel Project
   - `verify.eaugarowe.edu.so` → Verify Portal Project

#### **7.2 DNS Configuration**
Add these DNS records in your domain provider:

```dns
# Admin Panel
Type: CNAME
Name: admin
Value: cname.vercel-dns.com
TTL: 300

# Verification Portal  
Type: CNAME
Name: verify
Value: cname.vercel-dns.com
TTL: 300

# API Subdomain (optional)
Type: CNAME
Name: api
Value: cname.vercel-dns.com
TTL: 300
```

### **PHASE 8: DATABASE MIGRATION**

#### **8.1 Run Prisma Migrations**
```bash
# From backend directory
npx prisma generate
npx prisma db push

# Or for production migrations
npx prisma migrate deploy
```

#### **8.2 Seed Initial Data**
```bash
# Run initial data seeding
npm run seed:production
```

---

## 🔒 SECURITY CHECKLIST

### **Production Security Measures**

- [ ] **HTTPS Enforced** - Vercel provides automatic SSL
- [ ] **Environment Variables** - All secrets in Vercel env vars
- [ ] **CORS Configuration** - Restrict to your domains only
- [ ] **File Upload Validation** - Size and type restrictions
- [ ] **SQL Injection Protection** - Prisma provides this
- [ ] **XSS Protection** - React provides this by default
- [ ] **Rate Limiting** - Implement in backend API
- [ ] **JWT Security** - Strong secrets and proper expiration
- [ ] **Database Backups** - Neon.tech handles this
- [ ] **R2 Bucket Privacy** - Proper access controls

---

## 📊 MONITORING & MAINTENANCE

### **Vercel Analytics**
Enable in Vercel Dashboard:
- Performance monitoring
- Error tracking
- Usage analytics

### **Database Monitoring**
Neon.tech provides:
- Connection monitoring
- Query performance
- Storage usage

### **Log Monitoring**
```typescript
// Add to backend for production logging
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console()
  ]
});
```

---

## 🚀 DEPLOYMENT COMMANDS SUMMARY

```bash
# 1. Prepare Repository
git add .
git commit -m "feat: Production deployment ready"
git push origin main

# 2. Deploy Backend
cd backend
vercel --prod

# 3. Deploy Admin Panel  
cd ../apps/admin
vercel --prod

# 4. Deploy Verification Portal
cd ../verify
vercel --prod

# 5. Configure domains in Vercel Dashboard
# 6. Update DNS records
# 7. Run database migrations
# 8. Test all endpoints
```

---

## 💰 ESTIMATED COSTS

| Service | Plan | Monthly Cost |
|---------|------|--------------|
| **Vercel Pro** | 3 projects | $20/month |
| **Neon.tech** | Pro plan | $19/month |
| **Cloudflare R2** | Pay-as-use | ~$5-15/month |
| **Domain** | Existing | $0 |
| **Total** | | **~$44-54/month** |

---

## 🎯 POST-DEPLOYMENT CHECKLIST

- [ ] All domains resolve correctly
- [ ] SSL certificates active
- [ ] Database connections working
- [ ] File uploads to R2 working
- [ ] Admin login functional
- [ ] Certificate verification working
- [ ] Email notifications working (if configured)
- [ ] Performance monitoring enabled
- [ ] Backup systems verified
- [ ] Documentation updated

---

*🎉 Your EAU Credential System will be production-ready on professional infrastructure!*
