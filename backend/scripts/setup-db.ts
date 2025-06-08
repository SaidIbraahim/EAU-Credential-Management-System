import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  try {
    // Create super admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const superAdmin = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {
        passwordHash: hashedPassword,
        role: 'SUPER_ADMIN',
        isActive: true
      },
      create: {
        email: 'admin@example.com',
        passwordHash: hashedPassword,
        role: 'SUPER_ADMIN',
        isActive: true
      }
    });

    console.log('Created/Updated super admin:', superAdmin);

    // Create sample faculty
    const faculty = await prisma.faculty.upsert({
      where: { code: 'ENG' },
      update: {},
      create: {
        name: 'Faculty of Engineering',
        code: 'ENG',
        description: 'Engineering and Technology'
      }
    });

    console.log('Created/Updated faculty:', faculty);

    // Create sample department
    const department = await prisma.department.upsert({
      where: { code: 'CS' },
      update: {},
      create: {
        name: 'Computer Science',
        code: 'CS',
        description: 'Computer Science and Software Engineering',
        facultyId: faculty.id
      }
    });

    console.log('Created/Updated department:', department);

    // Create sample academic year
    const academicYear = await prisma.academicYear.upsert({
      where: { academicYear: '2023-2024' },
      update: {},
      create: {
        academicYear: '2023-2024',
        isActive: true
      }
    });

    console.log('Created/Updated academic year:', academicYear);

    console.log('\n===========================================');
    console.log('Database setup completed successfully!');
    console.log('===========================================');
    console.log('Admin Login Credentials:');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    console.log('===========================================');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 