import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export class DashboardController {
  /**
   * Get comprehensive dashboard statistics
   */
  static async getStats(req: Request, res: Response) {
    try {
      // Get current year for filtering
      const currentYear = new Date().getFullYear();
      const lastYear = currentYear - 1;

      // Run multiple queries in parallel for better performance
      const [
        totalStudents,
        totalDepartments,
        totalFaculties,
        maleStudents,
        femaleStudents,
        lastYearGraduates,
        certificatesIssued,
        perfectGPAStudents,
        departmentStats,
        gradeDistribution,
        topPerformingDepartment
      ] = await Promise.all([
        // Total students count
        prisma.student.count(),

        // Total departments count  
        prisma.department.count(),

        // Total faculties count
        prisma.faculty.count(),

        // Male students count
        prisma.student.count({
          where: { gender: 'MALE' }
        }),

        // Female students count
        prisma.student.count({
          where: { gender: 'FEMALE' }
        }),

        // Last year graduates (graduated in the previous year)
        prisma.student.count({
          where: {
            graduationDate: {
              gte: new Date(`${lastYear}-01-01`),
              lt: new Date(`${currentYear}-01-01`)
            }
          }
        }),

        // Students with certificate IDs (certificates issued)
        prisma.student.count({
          where: {
            certificateId: {
              not: null
            }
          }
        }),

        // Students with perfect GPA (4.0)
        prisma.student.count({
          where: {
            gpa: 4.0
          }
        }),

        // Department statistics with student counts
        prisma.department.findMany({
          include: {
            _count: {
              select: {
                students: true
              }
            },
            students: {
              select: {
                gpa: true
              }
            }
          }
        }),

        // Grade distribution
        prisma.student.groupBy({
          by: ['grade'],
          _count: {
            grade: true
          },
          where: {
            grade: {
              not: null
            }
          }
        }),

        // Top performing department by average GPA
        prisma.department.findMany({
          include: {
            students: {
              select: {
                gpa: true
              },
              where: {
                gpa: {
                  not: null
                }
              }
            }
          }
        })
      ]);

      // Get monthly registration trends using Prisma instead of raw SQL
      const monthlyRegistrations = await prisma.student.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000) // Last 12 months
          }
        },
        select: {
          createdAt: true
        }
      });

      // Process monthly data
      const monthlyData = monthlyRegistrations.reduce((acc: { [key: string]: number }, student) => {
        const monthKey = student.createdAt.toISOString().slice(0, 7); // YYYY-MM format
        acc[monthKey] = (acc[monthKey] || 0) + 1;
        return acc;
      }, {});

      const monthlyTrends = Object.entries(monthlyData)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month));

      // Calculate derived statistics
      const totalStudentsCount = totalStudents;
      const malePercentage = totalStudentsCount > 0 ? Math.round((maleStudents / totalStudentsCount) * 100) : 0;
      const femalePercentage = totalStudentsCount > 0 ? Math.round((femaleStudents / totalStudentsCount) * 100) : 0;
      const certificatePercentage = totalStudentsCount > 0 ? Math.round((certificatesIssued / totalStudentsCount) * 100) : 0;

      // Find top performing department
      let bestDepartment = null;
      let highestAvgGPA = 0;

      topPerformingDepartment.forEach(dept => {
        if (dept.students.length > 0) {
          const validGPAs = dept.students.filter(s => s.gpa !== null).map(s => s.gpa as number);
          if (validGPAs.length > 0) {
            const avgGPA = validGPAs.reduce((sum, gpa) => sum + gpa, 0) / validGPAs.length;
            if (avgGPA > highestAvgGPA) {
              highestAvgGPA = avgGPA;
              bestDepartment = {
                name: dept.name,
                avgGPA: Math.round(avgGPA * 100) / 100
              };
            }
          }
        }
      });

      // Prepare response data
      const statistics = {
        overview: {
          totalStudents: totalStudentsCount,
          totalDepartments,
          totalFaculties,
          maleStudents,
          femaleStudents,
          malePercentage,
          femalePercentage
        },
        graduates: {
          lastYearGraduates,
          certificatesIssued,
          certificatePercentage,
          perfectGPAStudents
        },
        performance: {
          bestDepartment: bestDepartment || { name: 'N/A', avgGPA: 0 },
          perfectGPACount: perfectGPAStudents
        },
        departments: departmentStats.map(dept => ({
          id: dept.id,
          name: dept.name,
          studentCount: dept._count.students,
          averageGPA: dept.students.length > 0 
            ? Math.round((dept.students.reduce((sum, s) => sum + (s.gpa || 0), 0) / dept.students.length) * 100) / 100
            : 0
        })),
        trends: {
          monthlyRegistrations: monthlyTrends,
          gradeDistribution: gradeDistribution.map(item => ({
            grade: item.grade,
            count: item._count.grade
          }))
        },
        lastUpdated: new Date().toISOString()
      };

      res.json({
        success: true,
        data: statistics
      });

    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard statistics'
      });
    }
  }

  /**
   * Get quick overview stats for dashboard cards
   */
  static async getQuickStats(req: Request, res: Response) {
    try {
      const [
        totalStudents,
        totalDepartments,
        maleStudents,
        femaleStudents,
        lastYearGraduates,
        certificatesIssued,
        perfectGPAStudents
      ] = await Promise.all([
        prisma.student.count(),
        prisma.department.count(),
        prisma.student.count({ where: { gender: 'MALE' } }),
        prisma.student.count({ where: { gender: 'FEMALE' } }),
        prisma.student.count({
          where: {
            graduationDate: {
              gte: new Date(`${new Date().getFullYear() - 1}-01-01`),
              lt: new Date(`${new Date().getFullYear()}-01-01`)
            }
          }
        }),
        prisma.student.count({
          where: { certificateId: { not: null } }
        }),
        prisma.student.count({
          where: { gpa: 4.0 }
        })
      ]);

      const malePercentage = totalStudents > 0 ? Math.round((maleStudents / totalStudents) * 100) : 0;
      const femalePercentage = totalStudents > 0 ? Math.round((femaleStudents / totalStudents) * 100) : 0;
      const certificatePercentage = totalStudents > 0 ? Math.round((certificatesIssued / totalStudents) * 100) : 0;

      res.json({
        success: true,
        data: {
          totalStudents,
          totalDepartments,
          maleStudents,
          femaleStudents,
          malePercentage,
          femalePercentage,
          lastYearGraduates,
          certificatesIssued,
          certificatePercentage,
          perfectGPAStudents
        }
      });

    } catch (error) {
      console.error('Quick stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch quick statistics'
      });
    }
  }
} 