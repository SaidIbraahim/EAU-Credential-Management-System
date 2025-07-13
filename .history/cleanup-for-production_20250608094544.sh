#!/bin/bash

# EAU-Credential System Production Cleanup Script
# This script removes test, debug, and development files that are not needed in production

echo "🧹 Starting production cleanup for EAU-Credential System..."

# Root level cleanup
echo "📁 Cleaning root directory..."
rm -f test-bulk-import.js
rm -f test-performance-fixed.js
rm -f debug-upload.js

# Backend cleanup
echo "📁 Cleaning backend directory..."
rm -f backend/test-email.js
rm -f backend/test-db-performance.js
rm -f backend/debug-upload.js
rm -f backend/src/test-logger.ts
rm -f backend/dist/test-logger.js
rm -f backend/dist/test-logger.js.map
rm -rf backend/dist/tests/
rm -f backend/dist/scripts/testOptimizations.js

# Admin app cleanup
echo "📁 Cleaning admin app..."
rm -f apps/admin/test-import.csv

# Verify app cleanup
echo "📁 Cleaning verify app..."
rm -f apps/verify/test-commit.txt

# Remove ngrok config files (if not needed in production)
echo "📁 Removing development configuration files..."
rm -f backend/ngrok-config.yml
rm -f apps/verify/ngrok-config.yml

# Remove .history directory (development artifacts)
echo "📁 Removing .history directory..."
rm -rf .history/

# Remove any .DS_Store files (macOS)
echo "📁 Removing system files..."
find . -name ".DS_Store" -delete 2>/dev/null || true

# Remove any temporary files
echo "📁 Removing temporary files..."
find . -name "*.tmp" -delete 2>/dev/null || true
find . -name "*.temp" -delete 2>/dev/null || true

# Remove any log files that shouldn't be in production
echo "📁 Cleaning log files..."
find . -name "*.log" -not -path "./backend/logs/*" -delete 2>/dev/null || true

# Clean up any test coverage files
echo "📁 Removing test coverage files..."
rm -rf coverage/
rm -rf .nyc_output/

# Remove any editor-specific files
echo "📁 Removing editor files..."
find . -name "*.swp" -delete 2>/dev/null || true
find . -name "*.swo" -delete 2>/dev/null || true
find . -name "*~" -delete 2>/dev/null || true

echo "✅ Production cleanup completed!"
echo ""
echo "📋 Summary of cleaned files:"
echo "   - Test and debug scripts"
echo "   - Development configuration files"
echo "   - History and temporary files"
echo "   - Editor and system artifacts"
echo ""
echo "🚀 System is now ready for production deployment!"
echo ""
echo "⚠️  Next steps:"
echo "   1. Review environment variables for production"
echo "   2. Update API endpoints if needed"
echo "   3. Set up production monitoring"
echo "   4. Configure production database"
echo "   5. Deploy to production environment" 