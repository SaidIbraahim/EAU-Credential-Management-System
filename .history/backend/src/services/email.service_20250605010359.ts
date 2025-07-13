import { Resend } from 'resend';

// Initialize Resend with better error handling
const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️  RESEND_API_KEY environment variable is not set');
    return null;
  }
  
  return new Resend(apiKey);
};

export class EmailService {
  /**
   * Send password reset email with verification code
   */
  static async sendPasswordResetEmail(
    email: string, 
    verificationCode: string,
    userName?: string
  ): Promise<void> {
    try {
      const apiKey = process.env.RESEND_API_KEY;
      
      if (!apiKey) {
        // For development without email service
        console.log('📧 Email service not configured. Development mode - verification code:', verificationCode);
        console.log('📝 Would send email to:', email);
        console.log('🔑 Verification code:', verificationCode);
        return;
      }

      const resend = new Resend(apiKey);

      const { data, error } = await resend.emails.send({
        from: 'EAU Credential System <onboarding@resend.dev>',
        to: [email],
        subject: 'Password Reset Request - EAU Credential System',
        html: this.getPasswordResetTemplate(verificationCode, userName),
      });

      if (error) {
        console.error('❌ Resend API error:', error);
        throw new Error(`Failed to send email: ${error.message}`);
      }

      console.log('✅ Password reset email sent successfully:', data?.id);
    } catch (error: any) {
      console.error('❌ Error sending password reset email:', error);
      
      // In development, still log the code for testing
      if (!process.env.RESEND_API_KEY) {
        console.log('🔧 Development mode - Use this verification code:', verificationCode);
        return; // Don't throw error in development
      }
      
      throw new Error('Failed to send password reset email');
    }
  }

  /**
   * Send password successfully reset notification
   */
  static async sendPasswordResetConfirmation(
    email: string,
    userName?: string
  ): Promise<void> {
    try {
      const apiKey = process.env.RESEND_API_KEY;
      
      if (!apiKey) {
        console.log('📧 Email service not configured. Would send confirmation to:', email);
        return;
      }

      const resend = new Resend(apiKey);

      const { data, error } = await resend.emails.send({
        from: 'EAU Credential System <onboarding@resend.dev>',
        to: [email],
        subject: 'Password Successfully Reset - EAU Credential System',
        html: this.getPasswordResetConfirmationTemplate(userName),
      });

      if (error) {
        console.error('❌ Resend API error:', error);
        throw new Error(`Failed to send email: ${error.message}`);
      }

      console.log('✅ Password reset confirmation sent successfully:', data?.id);
    } catch (error: any) {
      console.error('❌ Error sending password reset confirmation:', error);
      
      // Don't throw error for notification emails
      if (!process.env.RESEND_API_KEY) {
        console.log('🔧 Development mode - Password reset confirmation would be sent to:', email);
      }
    }
  }

  /**
   * HTML template for password reset email
   */
  private static getPasswordResetTemplate(verificationCode: string, userName?: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Request</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; margin-top: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { padding: 30px 20px; }
          .code-container { background: #f8f9fa; border: 2px dashed #6c757d; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
          .verification-code { font-size: 32px; font-weight: bold; color: #495057; letter-spacing: 3px; font-family: 'Courier New', monospace; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; border-radius: 0 0 10px 10px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0; color: #856404; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
            <p>EAU Credential Management System</p>
          </div>
          
          <div class="content">
            <h2>Hello${userName ? ` ${userName}` : ''}!</h2>
            
            <p>We received a request to reset your password for your EAU Credential System account. Please use the verification code below to proceed with resetting your password:</p>
            
            <div class="code-container">
              <p style="margin: 0; color: #6c757d;">Your verification code is:</p>
              <div class="verification-code">${verificationCode}</div>
            </div>
            
            <div class="warning">
              <strong>⚠️ Important Security Information:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>This code expires in <strong>15 minutes</strong></li>
                <li>Never share this code with anyone</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Contact support if you have concerns about account security</li>
              </ul>
            </div>
            
            <p>For your security, this link can only be used once and will expire automatically.</p>
            
            <p style="margin-top: 30px;">
              <strong>Need help?</strong><br>
              If you're having trouble or didn't request this password reset, please contact our support team.
            </p>
          </div>
          
          <div class="footer">
            <p><strong>EAU Credential Management System</strong></p>
            <p>This is an automated message. Please do not reply to this email.</p>
            <p style="font-size: 12px; margin-top: 15px;">
              © 2024 Ethiopian Aviation University. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * HTML template for password reset confirmation
   */
  private static getPasswordResetConfirmationTemplate(userName?: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Successfully Reset</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; margin-top: 20px; }
          .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { padding: 30px 20px; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; border-radius: 0 0 10px 10px; }
          .security-tip { background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 6px; padding: 15px; margin: 20px 0; color: #0c5460; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Password Successfully Reset</h1>
            <p>EAU Credential Management System</p>
          </div>
          
          <div class="content">
            <h2>Hello${userName ? ` ${userName}` : ''}!</h2>
            
            <p>Your password has been successfully reset for your EAU Credential System account.</p>
            
            <div class="security-tip">
              <strong>🔒 Security Recommendations:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Use a strong, unique password for this account</li>
                <li>Don't share your password with anyone</li>
                <li>Log out of shared or public devices</li>
                <li>Contact support immediately if you notice suspicious activity</li>
              </ul>
            </div>
            
            <p><strong>Didn't make this change?</strong><br>
            If you didn't reset your password, please contact our support team immediately as your account security may be compromised.</p>
            
            <p style="margin-top: 30px;">
              Thank you for keeping your account secure!
            </p>
          </div>
          
          <div class="footer">
            <p><strong>EAU Credential Management System</strong></p>
            <p>This is an automated message. Please do not reply to this email.</p>
            <p style="font-size: 12px; margin-top: 15px;">
              © 2024 Ethiopian Aviation University. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
} 