# =========================================
# EAU CREDENTIAL SYSTEM - CLEANUP SCRIPT
# Phase 2: Remove Duplicate Files
# =========================================

Write-Host "🚀 EAU Credential System - Duplicate File Cleanup" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Configuration
$BackupDir = ".\file-backups-$(Get-Date -Format 'yyyy-MM-dd-HHmm')"
$LogFile = ".\cleanup-log-$(Get-Date -Format 'yyyy-MM-dd-HHmm').txt"

# Initialize logging
function Write-Log {
    param($Message, $Level = "INFO")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] [$Level] $Message"
    Write-Host $LogEntry
    Add-Content -Path $LogFile -Value $LogEntry
}

Write-Log "🔧 Starting cleanup process..." "INFO"

# Create backup directory
Write-Log "📁 Creating backup directory: $BackupDir" "INFO"
try {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    New-Item -ItemType Directory -Path "$BackupDir\controllers" -Force | Out-Null
    New-Item -ItemType Directory -Path "$BackupDir\routes" -Force | Out-Null
    New-Item -ItemType Directory -Path "$BackupDir\controllers\optimized" -Force | Out-Null
    Write-Log "✅ Backup directories created successfully" "SUCCESS"
} catch {
    Write-Log "❌ Failed to create backup directories: $($_.Exception.Message)" "ERROR"
    exit 1
}

# =========================================
# PHASE 1: BACKUP DUPLICATE FILES
# =========================================

Write-Log "📋 Phase 1: Backing up duplicate files..." "INFO"

# Define files to backup and remove
$FilesToCleanup = @(
    # Duplicate Controllers
    @{
        Source = "backend\src\controllers\student.controller.ts"
        Backup = "$BackupDir\controllers\student.controller.ts"
        Description = "Original Student Controller (replaced by SimpleStudentController)"
    },
    @{
        Source = "backend\src\controllers\student.controller.ultra.ts"
        Backup = "$BackupDir\controllers\student.controller.ultra.ts"
        Description = "Ultra Student Controller (superseded by SimpleStudentController)"
    },
    @{
        Source = "backend\src\controllers\student.controller.cached.ts"
        Backup = "$BackupDir\controllers\student.controller.cached.ts"
        Description = "Cached Student Controller (superseded by SimpleStudentController)"
    },
    @{
        Source = "backend\src\controllers\optimized\student.controller.optimized.ts"
        Backup = "$BackupDir\controllers\optimized\student.controller.optimized.ts"
        Description = "Optimized Student Controller (superseded by SimpleStudentController)"
    },
    
    # Duplicate Routes
    @{
        Source = "backend\src\routes\student.routes.ts"
        Backup = "$BackupDir\routes\student.routes.ts"
        Description = "Original Student Routes (replaced by student.routes.simple.ts)"
    },
    @{
        Source = "backend\src\routes\student.routes.cached.ts"
        Backup = "$BackupDir\routes\student.routes.cached.ts"
        Description = "Cached Student Routes (superseded by student.routes.simple.ts)"
    },
    @{
        Source = "backend\src\routes\student.routes.ultra.ts"
        Backup = "$BackupDir\routes\student.routes.ultra.ts"
        Description = "Ultra Student Routes (superseded by student.routes.simple.ts)"
    },
    @{
        Source = "backend\src\routes\student.routes.optimized.ts"
        Backup = "$BackupDir\routes\student.routes.optimized.ts"
        Description = "Optimized Student Routes (superseded by student.routes.simple.ts)"
    }
)

# Backup files
$BackupCount = 0
foreach ($File in $FilesToCleanup) {
    if (Test-Path $File.Source) {
        try {
            Copy-Item -Path $File.Source -Destination $File.Backup -Force
            Write-Log "✅ Backed up: $($File.Source)" "SUCCESS"
            $BackupCount++
        } catch {
            Write-Log "❌ Failed to backup $($File.Source): $($_.Exception.Message)" "ERROR"
        }
    } else {
        Write-Log "⚠️ File not found: $($File.Source)" "WARNING"
    }
}

Write-Log "📁 Backup complete: $BackupCount files backed up" "INFO"

# =========================================
# PHASE 2: VERIFY ACTIVE FILES
# =========================================

Write-Log "🔍 Phase 2: Verifying active files..." "INFO"

# Define active files that should remain
$ActiveFiles = @(
    "backend\src\controllers\student.controller.simple.ts",
    "backend\src\routes\student.routes.simple.ts",
    "backend\src\controllers\optimized\auditlog.controller.optimized.ts",
    "backend\src\routes\academic.routes.optimized.ts",
    "backend\src\controllers\academic.controller.optimized.ts"
)

$ActiveFilesVerified = $true
foreach ($ActiveFile in $ActiveFiles) {
    if (Test-Path $ActiveFile) {
        Write-Log "✅ Active file verified: $ActiveFile" "SUCCESS"
    } else {
        Write-Log "❌ CRITICAL: Active file missing: $ActiveFile" "ERROR"
        $ActiveFilesVerified = $false
    }
}

if (-not $ActiveFilesVerified) {
    Write-Log "❌ CLEANUP ABORTED: Active files missing. System integrity compromised." "ERROR"
    exit 1
}

# =========================================
# PHASE 3: REMOVE DUPLICATE FILES
# =========================================

Write-Log "🗑️ Phase 3: Removing duplicate files..." "INFO"

$DeleteCount = 0
foreach ($File in $FilesToCleanup) {
    if (Test-Path $File.Source) {
        try {
            Remove-Item -Path $File.Source -Force
            Write-Log "🗑️ Removed: $($File.Source)" "SUCCESS"
            Write-Log "   └── $($File.Description)" "INFO"
            $DeleteCount++
        } catch {
            Write-Log "❌ Failed to remove $($File.Source): $($_.Exception.Message)" "ERROR"
        }
    }
}

Write-Log "🗑️ Cleanup complete: $DeleteCount files removed" "INFO"

# =========================================
# PHASE 4: VERIFY SYSTEM INTEGRITY
# =========================================

Write-Log "🔍 Phase 4: Verifying system integrity..." "INFO"

# Check if app.ts still has correct imports
$AppTsPath = "backend\src\app.ts"
if (Test-Path $AppTsPath) {
    $AppTsContent = Get-Content $AppTsPath -Raw
    
    # Check for correct imports
    $RequiredImports = @(
        "simpleStudentRoutes",
        "optimizedAcademicRoutes",
        "/api/students.*simpleStudentRoutes",
        "/api/academic.*optimizedAcademicRoutes"
    )
    
    $ImportCheckPassed = $true
    foreach ($Import in $RequiredImports) {
        if ($AppTsContent -match $Import) {
            Write-Log "✅ Import verified: $Import" "SUCCESS"
        } else {
            Write-Log "❌ Import missing: $Import" "ERROR"
            $ImportCheckPassed = $false
        }
    }
    
    if ($ImportCheckPassed) {
        Write-Log "✅ System integrity verified - all imports correct" "SUCCESS"
    } else {
        Write-Log "⚠️ System integrity warning - some imports may need review" "WARNING"
    }
} else {
    Write-Log "❌ CRITICAL: app.ts not found!" "ERROR"
}

# =========================================
# PHASE 5: CLEANUP SUMMARY
# =========================================

Write-Log "📊 Phase 5: Cleanup Summary" "INFO"
Write-Log "=============================================" "INFO"
Write-Log "✅ Files backed up: $BackupCount" "SUCCESS"
Write-Log "🗑️ Files removed: $DeleteCount" "SUCCESS"
Write-Log "📁 Backup location: $BackupDir" "INFO"
Write-Log "📋 Log file: $LogFile" "INFO"
Write-Log "=============================================" "INFO"

# =========================================
# PHASE 6: ACTIVE FILE SUMMARY
# =========================================

Write-Log "📋 Active Files (Remaining in System):" "INFO"
Write-Log "=============================================" "INFO"
Write-Log "✅ backend\src\controllers\student.controller.simple.ts" "SUCCESS"
Write-Log "   └── PRIMARY: Student operations with 5-min caching" "INFO"
Write-Log "✅ backend\src\routes\student.routes.simple.ts" "SUCCESS"
Write-Log "   └── PRIMARY: Student API routes" "INFO"
Write-Log "✅ backend\src\controllers\optimized\auditlog.controller.optimized.ts" "SUCCESS"
Write-Log "   └── PRIMARY: Audit log operations with raw SQL" "INFO"
Write-Log "✅ backend\src\controllers\academic.controller.optimized.ts" "SUCCESS"
Write-Log "   └── PRIMARY: Academic data with 15-min caching" "INFO"
Write-Log "✅ backend\src\routes\academic.routes.optimized.ts" "SUCCESS"
Write-Log "   └── PRIMARY: Academic API routes" "INFO"
Write-Log "=============================================" "INFO"

# =========================================
# PHASE 7: NEXT STEPS
# =========================================

Write-Log "🚀 Next Steps:" "INFO"
Write-Log "=============================================" "INFO"
Write-Log "1. Test the system to ensure everything works" "INFO"
Write-Log "2. Run: npm run dev (backend)" "INFO"
Write-Log "3. Run: npm run dev (frontend)" "INFO"
Write-Log "4. Verify all functionality works correctly" "INFO"
Write-Log "5. If issues occur, restore from backup: $BackupDir" "INFO"
Write-Log "=============================================" "INFO"

Write-Host "🎉 Cleanup completed successfully!" -ForegroundColor Green
Write-Host "📁 Backup created at: $BackupDir" -ForegroundColor Yellow
Write-Host "📋 Log file: $LogFile" -ForegroundColor Yellow 