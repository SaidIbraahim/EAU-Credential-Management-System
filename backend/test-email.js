// Quick test script for email functionality
require('dotenv').config();

const { EmailService } = require('./dist/services/email.service');

async function testEmail() {
  console.log('🧪 Testing Email Service...');
  console.log('=============================\n');

  // Check if API key is configured
  if (!process.env.RESEND_API_KEY) {
    console.log('❌ RESEND_API_KEY not found in environment variables');
    console.log('📋 Make sure your .env file contains: RESEND_API_KEY=re_your_api_key');
    return;
  }

  if (!process.env.RESEND_API_KEY.startsWith('re_')) {
    console.log('❌ Invalid RESEND_API_KEY format. Should start with "re_"');
    return;
  }

  console.log('✅ RESEND_API_KEY found and properly formatted');
  
  // Test email (you can change this to your email)
  const testEmail = 'test@example.com'; // Change this to your email for testing
  const testCode = '123456';

  console.log(`\n📧 Sending test email to: ${testEmail}`);
  console.log(`🔑 Test verification code: ${testCode}`);
  
  try {
    await EmailService.sendPasswordResetEmail(testEmail, testCode, 'Test User');
    console.log('\n✅ Email sent successfully!');
    console.log('📫 Check your email inbox for the password reset email');
    
    // Also test confirmation email
    setTimeout(async () => {
      console.log('\n📧 Sending confirmation email...');
      await EmailService.sendPasswordResetConfirmation(testEmail, 'Test User');
      console.log('✅ Confirmation email sent successfully!');
    }, 2000);
    
  } catch (error) {
    console.error('\n❌ Email sending failed:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Verify your RESEND_API_KEY is correct');
    console.log('2. Check if your Resend account is active');
    console.log('3. Ensure you have sufficient email credits');
    console.log('4. Check the Resend dashboard for any issues');
  }
}

// Only run if called directly
if (require.main === module) {
  testEmail().catch(console.error);
}

module.exports = { testEmail }; 