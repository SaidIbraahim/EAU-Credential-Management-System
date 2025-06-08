#!/bin/bash

# 🚀 EAU Credential System - Deployment Script
echo "🚀 Starting deployment of EAU Credential System..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Make sure we're logged in
echo "🔐 Checking Vercel authentication..."
vercel whoami || vercel login

echo ""
echo "📋 Deployment Plan:"
echo "1. Backend API"
echo "2. Admin Panel"
echo "3. Verification Portal"
echo ""

# Deploy Backend API
echo "🔧 Deploying Backend API..."
cd backend
echo "📁 Current directory: $(pwd)"
vercel --prod
if [ $? -eq 0 ]; then
    echo "✅ Backend deployed successfully!"
else
    echo "❌ Backend deployment failed!"
    exit 1
fi

# Deploy Admin Panel
echo ""
echo "👨‍💼 Deploying Admin Panel..."
cd ../apps/admin
echo "📁 Current directory: $(pwd)"
vercel --prod
if [ $? -eq 0 ]; then
    echo "✅ Admin Panel deployed successfully!"
else
    echo "❌ Admin Panel deployment failed!"
    exit 1
fi

# Deploy Verification Portal
echo ""
echo "🔍 Deploying Verification Portal..."
cd ../verify
echo "📁 Current directory: $(pwd)"
vercel --prod
if [ $? -eq 0 ]; then
    echo "✅ Verification Portal deployed successfully!"
else
    echo "❌ Verification Portal deployment failed!"
    exit 1
fi

# Return to root
cd ../../

echo ""
echo "🎉 All applications deployed successfully!"
echo ""
echo "🔗 Next Steps:"
echo "1. Configure custom domains in Vercel Dashboard:"
echo "   - admin.eaugarowe.edu.so → Admin Panel"
echo "   - verify.eaugarowe.edu.so → Verification Portal"
echo ""
echo "2. Update DNS records with your domain provider"
echo ""
echo "3. Run database migrations:"
echo "   cd backend && npx prisma migrate deploy"
echo ""
echo "4. Test all endpoints and functionalities"
echo ""
echo "📊 Monitor deployments at: https://vercel.com/dashboard" 