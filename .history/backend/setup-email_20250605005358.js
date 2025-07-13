#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 EAU Credential System - Email Setup');
console.log('=====================================\n');

const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
};

async function setupEmail() {
  console.log('📧 Setting up email service for forgot password functionality...\n');
  
  const choice = await askQuestion(
    '🔧 Choose email service setup:\n' +
    '1. Quick setup (development/testing) - Uses console logging\n' +
    '2. Resend setup (recommended) - Real email sending\n' +
    '3. Skip for now\n' +
    'Enter your choice (1-3): '
  );

  if (choice === '1') {
    console.log('\n✅ Quick setup selected!');
    console.log('📝 In development mode, verification codes will be displayed in the console.');
    console.log('🔍 Check your backend terminal for verification codes when testing.');
    createEnvFile(false);
    
  } else if (choice === '2') {
    console.log('\n🎯 Resend setup selected!');
    console.log('\n📋 Follow these steps to get your Resend API key:');
    console.log('1. Go to https://resend.com');
    console.log('2. Sign up for a free account (3,000 emails/month free)');
    console.log('3. Go to API Keys section');
    console.log('4. Create a new API key');
    console.log('5. Copy the API key (starts with "re_")');
    
    const apiKey = await askQuestion('\n🔑 Enter your Resend API key (or press Enter to skip): ');
    
    if (apiKey && apiKey.startsWith('re_')) {
      createEnvFile(true, apiKey);
      console.log('\n✅ Resend configured successfully!');
      console.log('📧 You can now send real emails for password reset.');
    } else if (apiKey) {
      console.log('\n❌ Invalid API key format. API keys should start with "re_"');
      console.log('🔧 Falling back to development mode.');
      createEnvFile(false);
    } else {
      console.log('\n🔧 Skipping API key setup. Using development mode.');
      createEnvFile(false);
    }
    
  } else {
    console.log('\n⏭️  Email setup skipped.');
    console.log('🔧 You can run this script again later or manually set RESEND_API_KEY in your .env file.');
  }

  console.log('\n🚀 Setup complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Start your backend server: npm run dev');
  console.log('2. Test the forgot password functionality');
  console.log('3. Check the console for verification codes (development mode)');
  console.log('4. Check your email inbox (if using Resend)');
  
  rl.close();
}

function createEnvFile(useResend, apiKey = '') {
  const envPath = path.join(__dirname, '.env');
  let envContent = '';

  // Read existing .env if it exists
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Remove existing RESEND_API_KEY line
  envContent = envContent.replace(/^RESEND_API_KEY=.*$/m, '');

  // Add RESEND_API_KEY
  if (useResend && apiKey) {
    envContent += `\n# Email Configuration (Resend)\nRESEND_API_KEY=${apiKey}\n`;
  } else {
    envContent += `\n# Email Configuration (Development Mode)\n# RESEND_API_KEY=your_api_key_here\n`;
  }

  // Ensure other required variables exist
  if (!envContent.includes('JWT_SECRET=')) {
    envContent += `\n# JWT Configuration\nJWT_SECRET=your-super-secret-jwt-key-change-this-in-production\n`;
  }

  if (!envContent.includes('DATABASE_URL=')) {
    envContent += `\n# Database Configuration\nDATABASE_URL=postgresql://username:password@localhost:5432/eau_credential_system\n`;
  }

  if (!envContent.includes('PORT=')) {
    envContent += `\n# Server Configuration\nPORT=8081\n`;
  }

  // Clean up extra newlines
  envContent = envContent.replace(/\n{3,}/g, '\n\n').trim() + '\n';

  fs.writeFileSync(envPath, envContent);
  console.log(`📁 Environment file ${useResend ? 'updated' : 'created'}: ${envPath}`);
}

// Run the setup
setupEmail().catch(console.error); 