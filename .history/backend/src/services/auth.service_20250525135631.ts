import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { CustomError } from '../utils/customError';
import { LoginDto, RegisterDto, TokenPayload, AuthResponse } from '../interfaces/auth.interface';

const prisma = new PrismaClient();

export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;

  constructor() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    this.jwtSecret = secret;
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1d';
  }

  async register(data: RegisterDto): Promise<AuthResponse> {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: data.username },
          { email: data.email }
        ]
      }
    });

    if (existingUser) {
      throw new CustomError(400, 'Username or email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        passwordHash: hashedPassword,
        role: data.role || 'ADMIN'
      }
    });

    const token = this.generateToken(user);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    };
  }

  async login(data: LoginDto): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: { username: data.username }
    });

    if (!user || !user.isActive) {
      throw new CustomError(401, 'Invalid credentials or inactive account');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new CustomError(401, 'Invalid credentials');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    const token = this.generateToken(user);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    };
  }

  private generateToken(user: any): string {
    const payload: TokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role
    };

    const options: SignOptions = {
      expiresIn: this.jwtExpiresIn
    };

    return jwt.sign(payload, this.jwtSecret, options);
  }
} 