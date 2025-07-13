import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { CustomError } from '../utils/customError';
import { LoginDto, RegisterDto, AuthResponse } from '../interfaces/auth.interface';

const prisma = new PrismaClient();

interface User {
  id: number;
  email: string;
  passwordHash: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
}

export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private static readonly JWT_EXPIRES_IN = '24h';

  private static generateToken(user: User): string {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, AuthService.JWT_SECRET, { expiresIn: AuthService.JWT_EXPIRES_IN });
  }

  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
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

  static async register(email: string, password: string, role: 'ADMIN' | 'SUPER_ADMIN' = 'ADMIN') {
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new Error('Email already exists');
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

  static async changePassword(userId: number, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashedPassword
      },
    });

    return { message: 'Password updated successfully' };
  }

  async register(data: RegisterDto): Promise<AuthResponse> {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email }
        ]
      }
    });

    if (existingUser) {
      throw new CustomError(400, 'Email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash: hashedPassword,
        role: data.role || 'ADMIN'
      }
    });

    const token = AuthService.generateToken(user);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    };
  }

  async login(data: LoginDto): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (!user) {
      throw new CustomError(401, 'Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new CustomError(401, 'Invalid credentials');
    }

    const token = AuthService.generateToken(user);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    };
  }
} 