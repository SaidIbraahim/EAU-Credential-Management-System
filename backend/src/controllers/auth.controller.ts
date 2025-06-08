import { Request, Response, NextFunction } from 'express';
import { compare, hash } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { EmailService } from '../services/email.service';

// In-memory storage for verification codes (in production, use Redis)
const verificationCodes = new Map<string, { code: string; expiresAt: Date; email: string }>();

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

      // Check if user account is active
      if (!user.isActive) {
        throw new AppError('Your account has been deactivated. Please contact the administrator for assistance.', 403);
      }

      // Check if user has a password set
      if (!user.passwordHash) {
        throw new AppError('Account not properly configured. Please contact administrator.', 401);
      }

    const isPasswordValid = await compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

      // Update last login timestamp
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLogin: new Date()
        },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          mustChangePassword: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
        }
      });

    const token = sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '1d' }
    );

    return res.json({
      data: {
          user: updatedUser,
        token,
      },
    });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { email } = req.body;

      if (!email) {
        throw new AppError('Email is required', 400);
      }

      // Check if user exists (but don't reveal if email exists for security)
      const user = await prisma.user.findUnique({
        where: { email },
      });

      // Always return success message for security (don't reveal if email exists)
      const successMessage = 'If this email is registered in our system, you will receive a verification code shortly.';

      if (user && user.isActive) {
        // Generate 6-digit verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // Store verification code
        verificationCodes.set(email, {
          code: verificationCode,
          expiresAt,
          email
        });

        // Send email with verification code
        try {
          await EmailService.sendPasswordResetEmail(email, verificationCode, user.email);
          console.log(`Password reset email sent to: ${email}`);
        } catch (emailError) {
          console.error('Failed to send password reset email:', emailError);
          // Don't throw error to prevent email service issues from blocking the flow
          // The user will still get the success message
        }
      }

      return res.json({
        success: true,
        message: successMessage
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyResetCode(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        throw new AppError('Email and verification code are required', 400);
      }

      const storedData = verificationCodes.get(email);

      if (!storedData) {
        throw new AppError('Invalid or expired verification code', 400);
      }

      if (storedData.code !== code) {
        throw new AppError('Invalid verification code', 400);
      }

      if (new Date() > storedData.expiresAt) {
        verificationCodes.delete(email);
        throw new AppError('Verification code has expired', 400);
      }

      // Code is valid, extend expiry for password reset
      storedData.expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 more minutes
      verificationCodes.set(email, storedData);

      return res.json({
        success: true,
        message: 'Verification successful. You can now reset your password.'
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { email, code, newPassword } = req.body;

      if (!email || !code || !newPassword) {
        throw new AppError('Email, verification code, and new password are required', 400);
      }

      // Validate password strength
      if (newPassword.length < 8) {
        throw new AppError('Password must be at least 8 characters long', 400);
      }

      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(newPassword)) {
        throw new AppError('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character', 400);
      }

      const storedData = verificationCodes.get(email);

      if (!storedData || storedData.code !== code) {
        throw new AppError('Invalid or expired verification code', 400);
      }

      if (new Date() > storedData.expiresAt) {
        verificationCodes.delete(email);
        throw new AppError('Verification code has expired', 400);
      }

      // Find and update user password
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user || !user.isActive) {
        throw new AppError('User not found or account is deactivated', 404);
      }

      const hashedPassword = await hash(newPassword, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          passwordHash: hashedPassword,
          mustChangePassword: false
        },
      });

      // Clean up verification code
      verificationCodes.delete(email);

      // Send password reset confirmation email
      try {
        await EmailService.sendPasswordResetConfirmation(email, user.email);
        console.log(`Password reset confirmation sent to: ${email}`);
      } catch (emailError) {
        console.error('Failed to send password reset confirmation:', emailError);
        // Don't throw error for notification emails
      }

      return res.json({
        success: true,
        message: 'Password reset successful. You can now login with your new password.'
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(_req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
    return res.json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
    const userId = (req as any).user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
          isActive: true,
          mustChangePassword: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

      // Additional check: if user becomes inactive while logged in
      if (!user.isActive) {
        throw new AppError('Your account has been deactivated. Please contact the administrator.', 403);
      }

    return res.json({ data: user });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
    const userId = (req as any).user.id;
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

      // Check if user account is still active
      if (!user.isActive) {
        throw new AppError('Your account has been deactivated. Please contact the administrator.', 403);
      }

      // Check if user has a current password set
      if (!user.passwordHash) {
        throw new AppError('No password currently set. Please contact administrator.', 400);
      }

    const isPasswordValid = await compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    const hashedPassword = await hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
        data: { 
          passwordHash: hashedPassword,
          mustChangePassword: false
        },
    });

    return res.json({ message: 'Password updated successfully' });
    } catch (error) {
      next(error);
    }
  }
} 