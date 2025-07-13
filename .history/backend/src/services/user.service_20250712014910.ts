import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface CreateUserInput {
  email: string;
  password: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
}

interface UpdateUserInput {
  email?: string;
  role?: 'ADMIN' | 'SUPER_ADMIN';
  isActive?: boolean;
}

type UserResponse = {
  id: number;
  email: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  isActive: boolean;
  mustChangePassword: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
};

export class UserService {
  static async createUser(data: CreateUserInput): Promise<UserResponse> {
    const { password, ...rest } = data;
    
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email: data.email
      }
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        ...rest,
        passwordHash,
        isActive: true,
        mustChangePassword: false
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

    logger.info(`User created: ${user.email}`);
    return {
      ...user,
      lastLogin: user.lastLogin?.toISOString(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  static async getUsers(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
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
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.user.count()
    ]);

    const formattedUsers = users.map(user => ({
      ...user,
      lastLogin: user.lastLogin?.toISOString(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }));

    return {
      users: formattedUsers,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    };
  }

  static async getUserById(id: number): Promise<UserResponse> {
    const user = await prisma.user.findUnique({
      where: { id },
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

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return {
      ...user,
      lastLogin: user.lastLogin?.toISOString(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  static async updateUser(id: number, data: UpdateUserInput): Promise<UserResponse> {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      throw new AppError('User not found', 404);
    }

    // Check email uniqueness if being updated
    if (data.email) {
      const duplicate = await prisma.user.findFirst({
        where: {
          email: data.email,
          NOT: { id }
        }
      });

      if (duplicate) {
        throw new AppError('Email already in use', 409);
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
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

    logger.info(`User updated: ${updatedUser.email}`);
    return {
      ...updatedUser,
      lastLogin: updatedUser.lastLogin?.toISOString(),
      createdAt: updatedUser.createdAt.toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString(),
    };
  }

  static async changePassword(id: number, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if user has a current password set
    if (!user.passwordHash) {
      throw new AppError('No password currently set. Please contact administrator.', 400);
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError('Current password is incorrect', 401);
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        mustChangePassword: false
      }
    });

    logger.info(`Password changed for user: ${user.email}`);
    return { message: 'Password updated successfully' };
  }

  static async deleteUser(id: number) {
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Use a transaction to safely delete user and related records
    await prisma.$transaction(async (tx) => {
      // First, count and delete all audit logs associated with this user
      const auditLogCount = await tx.auditLog.count({
        where: { userId: id }
      });

      await tx.auditLog.deleteMany({
        where: { userId: id }
      });

      // Then delete the user
      await tx.user.delete({
        where: { id }
      });

      logger.info(`User deleted: ${user.email} (including ${auditLogCount} audit log records)`);
    });

    return { message: 'User deleted successfully' };
  }
} 