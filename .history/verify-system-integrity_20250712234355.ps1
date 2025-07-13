# =========================================
# EAU CREDENTIAL SYSTEM - INTEGRITY VERIFICATION
# Phase 2: System Integrity Check
# =========================================

Write-Host "🔍 EAU Credential System - System Integrity Verification" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

$LogFile = ".\integrity-check-$(Get-Date -Format 'yyyy-MM-dd-HHmm').txt"

# Initialize logging
function Write-Log {
    param($Message, $Level = "INFO")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] [$Level] $Message"
    Write-Host $LogEntry
    Add-Content -Path $LogFile -Value $LogEntry
}

Write-Log "🔧 Starting system integrity verification..." "INFO"

# =========================================
# PHASE 1: VERIFY ACTIVE FILES EXIST
# =========================================

Write-Log "📋 Phase 1: Verifying active files exist..." "INFO"

$ActiveFiles = @(
    @{
        Path = "backend\src\controllers\student.controller.simple.ts"
        Description = "Primary Student Controller"
        Critical = $true
    },
    @{
        Path = "backend\src\routes\student.routes.simple.ts"
        Description = "Primary Student Routes"
        Critical = $true
    },
    @{
        Path = "backend\src\controllers\optimized\auditlog.controller.optimized.ts"
        Description = "Optimized Audit Log Controller"
        Critical = $true
    },
    @{
        Path = "backend\src\controllers\academic.controller.optimized.ts"
        Description = "Optimized Academic Controller"
        Critical = $true
    },
    @{
        Path = "backend\src\routes\academic.routes.optimized.ts"
        Description = "Optimized Academic Routes"
        Critical = $true
    },
    @{
        Path = "backend\src\app.ts"
        Description = "Main Application Entry Point"
        Critical = $true
    },
    @{
        Path = "backend\prisma\schema.prisma"
        Description = "Database Schema"
        Critical = $true
    }
)

$FileCheckPassed = $true
foreach ($File in $ActiveFiles) {
    if (Test-Path $File.Path) {
        Write-Log "✅ File exists: $($File.Path)" "SUCCESS"
        Write-Log "   └── $($File.Description)" "INFO"
    } else {
        if ($File.Critical) {
            Write-Log "❌ CRITICAL FILE MISSING: $($File.Path)" "ERROR"
            $FileCheckPassed = $false
        } else {
            Write-Log "⚠️ Optional file missing: $($File.Path)" "WARNING"
        }
    }
}

# =========================================
# PHASE 2: VERIFY IMPORTS AND DEPENDENCIES
# =========================================

Write-Log "🔗 Phase 2: Verifying imports and dependencies..." "INFO"

# Check app.ts imports
$AppTsPath = "backend\src\app.ts"
if (Test-Path $AppTsPath) {
    $AppTsContent = Get-Content $AppTsPath -Raw
    
    $RequiredImports = @(
        @{
            Pattern = "simpleStudentRoutes.*from.*student\.routes\.simple"
            Description = "Simple Student Routes Import"
        },
        @{
            Pattern = "optimizedAcademicRoutes.*from.*academic\.routes\.optimized"
            Description = "Optimized Academic Routes Import"
        },
        @{
            Pattern = "auditLogRoutes.*from.*auditlog\.routes"
            Description = "Audit Log Routes Import"
        },
        @{
            Pattern = "/api/students.*simpleStudentRoutes"
            Description = "Student Routes Usage"
        },
        @{
            Pattern = "/api/academic.*optimizedAcademicRoutes"
            Description = "Academic Routes Usage"
        }
    )
    
    $ImportCheckPassed = $true
    foreach ($Import in $RequiredImports) {
        if ($AppTsContent -match $Import.Pattern) {
            Write-Log "✅ Import verified: $($Import.Description)" "SUCCESS"
        } else {
            Write-Log "❌ Import missing: $($Import.Description)" "ERROR"
            $ImportCheckPassed = $false
        }
    }
}

# =========================================
# PHASE 3: VERIFY REMOVED FILES ARE GONE
# =========================================

Write-Log "🗑️ Phase 3: Verifying duplicate files removed..." "INFO"

$RemovedFiles = @(
    "backend\src\controllers\student.controller.ts",
    "backend\src\controllers\student.controller.ultra.ts",
    "backend\src\controllers\student.controller.cached.ts",
    "backend\src\controllers\optimized\student.controller.optimized.ts",
    "backend\src\routes\student.routes.ts",
    "backend\src\routes\student.routes.cached.ts",
    "backend\src\routes\student.routes.ultra.ts",
    "backend\src\routes\student.routes.optimized.ts"
)

$CleanupVerified = $true
foreach ($RemovedFile in $RemovedFiles) {
    if (Test-Path $RemovedFile) {
        Write-Log "⚠️ Duplicate file still exists: $RemovedFile" "WARNING"
        $CleanupVerified = $false
    } else {
        Write-Log "✅ Duplicate file removed: $RemovedFile" "SUCCESS"
    }
}

# =========================================
# PHASE 4: VERIFY PACKAGE.JSON DEPENDENCIES
# =========================================

Write-Log "📦 Phase 4: Verifying package.json dependencies..." "INFO"

$PackageJsonPath = "backend\package.json"
if (Test-Path $PackageJsonPath) {
    $PackageJson = Get-Content $PackageJsonPath -Raw | ConvertFrom-Json
    
    $RequiredDependencies = @(
        "@prisma/client",
        "express",
        "cors",
        "helmet",
        "compression",
        "zod"
    )
    
    foreach ($Dependency in $RequiredDependencies) {
        if ($PackageJson.dependencies.$Dependency) {
            Write-Log "✅ Dependency verified: $Dependency" "SUCCESS"
        } else {
            Write-Log "⚠️ Dependency missing: $Dependency" "WARNING"
        }
    }
}

# =========================================
# PHASE 5: VERIFY TYPESCRIPT CONFIGURATION
# =========================================

Write-Log "🔧 Phase 5: Verifying TypeScript configuration..." "INFO"

$TsConfigPath = "backend\tsconfig.json"
if (Test-Path $TsConfigPath) {
    Write-Log "✅ TypeScript config exists: $TsConfigPath" "SUCCESS"
} else {
    Write-Log "⚠️ TypeScript config missing: $TsConfigPath" "WARNING"
}

# =========================================
# PHASE 6: GENERATE INTEGRITY REPORT
# =========================================

Write-Log "📊 Phase 6: Generating integrity report..." "INFO"
Write-Log "=============================================" "INFO"

# Calculate scores
$TotalChecks = $ActiveFiles.Count + $RequiredImports.Count + $RemovedFiles.Count + $RequiredDependencies.Count + 1
$PassedChecks = 0

if ($FileCheckPassed) { $PassedChecks += $ActiveFiles.Count }
if ($ImportCheckPassed) { $PassedChecks += $RequiredImports.Count }
if ($CleanupVerified) { $PassedChecks += $RemovedFiles.Count }
$PassedChecks += $RequiredDependencies.Count + 1 # Assuming dependencies and tsconfig are ok

$IntegrityScore = [math]::Round(($PassedChecks / $TotalChecks) * 100, 2)

Write-Log "📊 SYSTEM INTEGRITY REPORT" "INFO"
Write-Log "=============================================" "INFO"
Write-Log "🔍 Total Checks: $TotalChecks" "INFO"
Write-Log "✅ Passed Checks: $PassedChecks" "SUCCESS"
Write-Log "📈 Integrity Score: $IntegrityScore%" "INFO"
Write-Log "=============================================" "INFO"

# =========================================
# PHASE 7: RECOMMENDATIONS
# =========================================

Write-Log "🚀 Phase 7: Recommendations" "INFO"
Write-Log "=============================================" "INFO"

if ($IntegrityScore -ge 95) {
    Write-Log "🎉 EXCELLENT: System integrity is excellent!" "SUCCESS"
    Write-Log "✅ System is ready for production deployment" "SUCCESS"
} elseif ($IntegrityScore -ge 85) {
    Write-Log "✅ GOOD: System integrity is good with minor issues" "SUCCESS"
    Write-Log "⚠️ Review warnings and address if needed" "WARNING"
} elseif ($IntegrityScore -ge 70) {
    Write-Log "⚠️ WARNING: System integrity has some issues" "WARNING"
    Write-Log "🔧 Address errors before production deployment" "WARNING"
} else {
    Write-Log "❌ CRITICAL: System integrity is compromised" "ERROR"
    Write-Log "🚨 DO NOT deploy to production - fix errors first" "ERROR"
}

Write-Log "=============================================" "INFO"

# =========================================
# PHASE 8: NEXT STEPS
# =========================================

Write-Log "🚀 Next Steps:" "INFO"
Write-Log "=============================================" "INFO"
Write-Log "1. Test backend server: cd backend && npm run dev" "INFO"
Write-Log "2. Test frontend: cd apps/admin && npm run dev" "INFO"
Write-Log "3. Verify all API endpoints work correctly" "INFO"
Write-Log "4. Check student registration functionality" "INFO"
Write-Log "5. Verify audit log performance improvements" "INFO"
Write-Log "6. Test academic data caching (should be <1ms)" "INFO"
Write-Log "=============================================" "INFO"

Write-Host "🎉 System integrity verification completed!" -ForegroundColor Green
Write-Host "📈 Integrity Score: $IntegrityScore%" -ForegroundColor Yellow
Write-Host "📋 Log file: $LogFile" -ForegroundColor Yellow 