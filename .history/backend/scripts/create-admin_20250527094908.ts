import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const adminEmail = 'admin@example.com';
    const adminUsername = 'admin';
    const adminPassword = 'admin123';

    // Check if admin exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { email: adminEmail },
          { username: adminUsername }
        ]
      }
    });

    if (existingAdmin) {
      // Update admin password
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const updatedAdmin = await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          passwordHash: hashedPassword,
          isActive: true,
          role: 'SUPER_ADMIN'
        }
      });
      console.log('Admin user updated:', {
        username: updatedAdmin.username,
        email: updatedAdmin.email,
        role: updatedAdmin.role
      });
    } else {
      // Create new admin
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const newAdmin = await prisma.user.create({
        data: {
          username: adminUsername,
          email: adminEmail,
          passwordHash: hashedPassword,
          role: 'SUPER_ADMIN',
          isActive: true
        }
      });
      console.log('Admin user created:', {
        username: newAdmin.username,
        email: newAdmin.email,
        role: newAdmin.role
      });
    }

    console.log('\nAdmin Credentials:');
    console.log('------------------');
    console.log('Username:', adminUsername);
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