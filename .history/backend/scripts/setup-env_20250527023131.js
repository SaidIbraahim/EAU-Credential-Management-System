const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generate a secure random string
const generateSecret = () => {
    return crypto.randomBytes(64).toString('base64');
};

// Default environment variables
const defaultEnv = {
    // Server Configuration
    PORT: 5000,
    NODE_ENV: 'development',

    // JWT Configuration
    JWT_SECRET: generateSecret(),
    JWT_EXPIRES_IN: '24h',
    JWT_REFRESH_EXPIRES_IN: '7d',

    // Database Configuration
    DATABASE_URL: 'postgresql://postgres:your_password@localhost:5432/eau_credential_db',

    // CORS Configuration
    CORS_ORIGIN: 'http://localhost:8081',

    // File Upload Configuration
    MAX_FILE_SIZE: 10485760, // 10MB in bytes
    ALLOWED_FILE_TYPES: 'image/jpeg,image/png,application/pdf',
    UPLOAD_DIR: 'uploads',

    // Rate Limiting
    RATE_LIMIT_WINDOW: '15m',
    RATE_LIMIT_MAX_REQUESTS: 100,

    // Logging
    LOG_LEVEL: 'debug',
    LOG_FORMAT: 'combined'
};

// Path to .env file
const envPath = path.join(__dirname, '..', '.env');

try {
    // Convert environment object to string
    let envContent = Object.entries(defaultEnv)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

    // Write to .env file
    fs.writeFileSync(envPath, envContent + '\n');

    console.log('✅ Environment variables have been set up successfully');
    console.log('🔐 A new secure JWT secret has been generated');
    console.log('📝 Please update the following variables in .env:');
    console.log('   - DATABASE_URL (with your database credentials)');
    console.log('   - Any other values specific to your setup');
} catch (error) {
    console.error('❌ Error setting up environment variables:', error.message);
    process.exit(1);
} 