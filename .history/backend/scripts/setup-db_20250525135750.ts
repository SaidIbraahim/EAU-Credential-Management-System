import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  try {
    // Create super admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const superAdmin = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        username: 'admin',
        passwordHash: hashedPassword,
        role: 'SUPER_ADMIN',
        isActive: true
      }
    });

    console.log('Created super admin:', superAdmin);

    // Create sample faculty
    const faculty = await prisma.faculty.create({
      data: {
        name: 'Faculty of Engineering',
        code: 'ENG',
        description: 'Engineering and Technology'
      }
    });

    console.log('Created faculty:', faculty);

    // Create sample department
    const department = await prisma.department.create({
      data: {
        name: 'Computer Science',
        code: 'CS',
        description: 'Computer Science and Software Engineering',
        facultyId: faculty.id
      }
    });

    console.log('Created department:', department);

    // Create sample academic year
    const academicYear = await prisma.academicYear.create({
      data: {
        academicYear: '2023-2024',
        isActive: true
      }
    });

    console.log('Created academic year:', academicYear);

    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 