# 🚀 EAU Credential System - Deployment Script (PowerShell)
Write-Host "🚀 Starting deployment of EAU Credential System..." -ForegroundColor Green

# Check if Vercel CLI is installed
if (!(Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel
}

# Make sure we're logged in
Write-Host "🔐 Checking Vercel authentication..." -ForegroundColor Yellow
vercel whoami
if ($LASTEXITCODE -ne 0) {
    vercel login
}

Write-Host ""
Write-Host "📋 Deployment Plan:" -ForegroundColor Cyan
Write-Host "1. Backend API"
Write-Host "2. Admin Panel" 
Write-Host "3. Verification Portal"
Write-Host ""

# Deploy Backend API
Write-Host "🔧 Deploying Backend API..." -ForegroundColor Blue
Set-Location backend
Write-Host "📁 Current directory: $(Get-Location)"
vercel --prod
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backend deployed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Backend deployment failed!" -ForegroundColor Red
    exit 1
}

# Deploy Admin Panel
Write-Host ""
Write-Host "👨‍💼 Deploying Admin Panel..." -ForegroundColor Blue
Set-Location ../apps/admin
Write-Host "📁 Current directory: $(Get-Location)"
vercel --prod
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Admin Panel deployed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Admin Panel deployment failed!" -ForegroundColor Red
    exit 1
}

# Deploy Verification Portal
Write-Host ""
Write-Host "🔍 Deploying Verification Portal..." -ForegroundColor Blue
Set-Location ../verify
Write-Host "📁 Current directory: $(Get-Location)"
vercel --prod
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Verification Portal deployed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Verification Portal deployment failed!" -ForegroundColor Red
    exit 1
}

# Return to root
Set-Location ../../

Write-Host ""
Write-Host "🎉 All applications deployed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Configure custom domains in Vercel Dashboard:"
Write-Host "   - admin.eaugarowe.edu.so → Admin Panel"
Write-Host "   - verify.eaugarowe.edu.so → Verification Portal"
Write-Host ""
Write-Host "2. Update DNS records with your domain provider"
Write-Host ""
Write-Host "3. Run database migrations:"
Write-Host "   cd backend && npx prisma migrate deploy"
Write-Host ""
Write-Host "4. Test all endpoints and functionalities"
Write-Host ""
Write-Host "📊 Monitor deployments at: https://vercel.com/dashboard" -ForegroundColor Yellow 