const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generate a secure random string of 64 bytes (512 bits) and convert to base64
const generateSecret = () => {
    return crypto.randomBytes(64).toString('base64');
};

// Path to .env file
const envPath = path.join(__dirname, '..', '.env');

try {
    // Generate the secret
    const jwtSecret = generateSecret();
    
    // Read existing .env content if file exists
    let envContent = '';
    try {
        envContent = fs.readFileSync(envPath, 'utf8');
    } catch (error) {
        // File doesn't exist, that's okay
    }

    // Check if JWT_SECRET already exists in .env
    if (envContent.includes('JWT_SECRET=')) {
        // Replace existing JWT_SECRET
        envContent = envContent.replace(
            /JWT_SECRET=.*/,
            `JWT_SECRET=${jwtSecret}`
        );
    } else {
        // Add new JWT_SECRET
        envContent += `\nJWT_SECRET=${jwtSecret}`;
    }

    // Write back to .env
    fs.writeFileSync(envPath, envContent.trim() + '\n');

    console.log('✅ JWT_SECRET has been generated and added to .env');
    console.log('🔐 Your secret is secure and ready to use');
} catch (error) {
    console.error('❌ Error generating JWT_SECRET:', error.message);
    process.exit(1);
} 