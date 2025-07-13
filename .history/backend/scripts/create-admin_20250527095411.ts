import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const adminEmail = 'admin@example.com';
    const adminPassword = 'admin123';

    // Check if admin exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (existingAdmin) {
      // Update admin password
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const updatedAdmin = await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          passwordHash: hashedPassword,
          role: 'SUPER_ADMIN'
        }
      });
      console.log('Admin user updated:', {
        email: updatedAdmin.email,
        role: updatedAdmin.role
      });
    } else {
      // Create new admin
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const newAdmin = await prisma.user.create({
        data: {
          email: adminEmail,
          passwordHash: hashedPassword,
          role: 'SUPER_ADMIN'
        }
      });
      console.log('Admin user created:', {
        email: newAdmin.email,
        role: newAdmin.role
      });
    }

    console.log('\nAdmin Credentials:');
    console.log('------------------');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('------------------');

  } catch (error) {
    console.error('Error creating/updating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin(); 