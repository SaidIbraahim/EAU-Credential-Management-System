import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AuthService } from '../services/auth.service';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

describe('AuthService', () => {
  const testUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'Test123!@#',
    role: 'ADMIN' as const
  };

  beforeAll(async () => {
    // Clean up any existing test user
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: testUser.email },
          { username: testUser.username }
        ]
      }
    });
  });

  afterAll(async () => {
    // Clean up after tests
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: testUser.email },
          { username: testUser.username }
        ]
      }
    });
    await prisma.$disconnect();
  });

  it('should register a new user', async () => {
    const result = await AuthService.register(
      testUser.username,
      testUser.email,
      testUser.password,
      testUser.role
    );

    expect(result.user).toBeDefined();
    expect(result.user.username).toBe(testUser.username);
    expect(result.user.email).toBe(testUser.email);
    expect(result.user.role).toBe(testUser.role);
    expect(result.token).toBeDefined();

    // Verify JWT token
    const decoded = jwt.verify(
      result.token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as { userId: number; role: string };
    expect(decoded.userId).toBeDefined();
    expect(decoded.role).toBe(testUser.role);
  });

  it('should login existing user', async () => {
    const result = await AuthService.login(testUser.username, testUser.password);

    expect(result.user).toBeDefined();
    expect(result.user.username).toBe(testUser.username);
    expect(result.user.email).toBe(testUser.email);
    expect(result.token).toBeDefined();
  });

  it('should fail with invalid credentials', async () => {
    await expect(
      AuthService.login(testUser.username, 'wrongpassword')
    ).rejects.toThrow('Invalid credentials');
  });

  it('should change password successfully', async () => {
    // First login to get user ID
    const loginResult = await AuthService.login(testUser.username, testUser.password);
    
    // Change password
    const newPassword = 'NewTest456!@#';
    await AuthService.changePassword(loginResult.user.id, newPassword);

    // Try logging in with new password
    const newLoginResult = await AuthService.login(testUser.username, newPassword);
    expect(newLoginResult.user).toBeDefined();
    expect(newLoginResult.token).toBeDefined();
  });
}); 