import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    });

    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('✅ Admin user found:');
    console.log('  ID:', admin.id);
    console.log('  Email:', admin.email);
    console.log('  Role:', admin.role);
    console.log('  Active:', admin.isActive);
    console.log('  Has Password Hash:', !!admin.passwordHash);

    if (admin.passwordHash) {
      // Test password verification
      const isValidPassword = await bcrypt.compare('admin123', admin.passwordHash);
      console.log('  Password "admin123" valid:', isValidPassword ? '✅' : '❌');
    }

  } catch (error) {
    console.error('Error checking admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin(); 