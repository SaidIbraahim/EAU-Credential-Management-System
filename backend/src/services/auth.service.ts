import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { CustomError } from '../utils/customError';
import { AuthResponse, TokenPayload } from '../interfaces/auth.interface';

const prisma = new PrismaClient();

interface User {
  id: number;
  email: string;
  passwordHash: string | null;
  role: 'ADMIN' | 'SUPER_ADMIN';
}

export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private static readonly JWT_EXPIRES_IN = '24h';

  private static generateToken(user: Pick<User, 'id' | 'email' | 'role'>): string {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, AuthService.JWT_SECRET, { expiresIn: AuthService.JWT_EXPIRES_IN });
  }

  static async login(email: string, password: string): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new CustomError(401, 'Invalid credentials');
    }

    if (!user.passwordHash) {
      throw new CustomError(401, 'Account not properly configured. Please contact administrator.');
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new CustomError(401, 'Invalid credentials');
    }

    return {
      token: AuthService.generateToken(user),
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
    };
  }

  static async register(email: string, password: string, role: 'ADMIN' | 'SUPER_ADMIN' = 'ADMIN'): Promise<AuthResponse> {
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new CustomError(400, 'Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        role
      },
    });

    return {
      token: AuthService.generateToken(user),
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
    };
  }

  static async changePassword(userId: number, newPassword: string): Promise<{ message: string }> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashedPassword
      },
    });

    return { message: 'Password updated successfully' };
  }
} 