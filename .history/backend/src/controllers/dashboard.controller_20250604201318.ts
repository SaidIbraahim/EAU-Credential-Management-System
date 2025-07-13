import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export class DashboardController {
  /**
   * Get comprehensive dashboard statistics
   */
  static async getStats(_req: Request, res: Response) {
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

      // Helper function to convert Decimal to number
      const decimalToNumber = (decimal: Decimal | null): number => {
        return decimal ? parseFloat(decimal.toString()) : 0;
      };

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
          const validGPAs = dept.students.filter(s => s.gpa !== null).map(s => decimalToNumber(s.gpa));
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
            ? Math.round((dept.students.reduce((sum, s) => sum + decimalToNumber(s.gpa), 0) / dept.students.length) * 100) / 100
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
  static async getQuickStats(_req: Request, res: Response) {
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

  /**
   * Get comprehensive reports data for Reports page
   */
  static async getReports(_req: Request, res: Response) {
    try {
      // Helper function to convert Decimal to number
      const decimalToNumber = (decimal: Decimal | null): number => {
        return decimal ? parseFloat(decimal.toString()) : 0;
      };

      // Get comprehensive report data in parallel
      const [
        departmentDistribution,
        facultyDistribution,
        gpaAnalysis,
        gradeDistribution,
        yearlyAdmissions,
        genderAnalysis,
        certificateStatus,
        academicYearDistribution,
        topPerformers,
        graduationTrends
      ] = await Promise.all([
        // Department distribution with detailed stats
        prisma.department.findMany({
          include: {
            _count: {
              select: { students: true }
            },
            faculty: {
              select: { name: true }
            },
            students: {
              select: { 
                gpa: true,
                gender: true,
                certificateId: true
              }
            }
          }
        }),

        // Faculty distribution
        prisma.faculty.findMany({
          include: {
            _count: {
              select: { 
                departments: true,
                students: true
              }
            }
          }
        }),

        // All students for GPA analysis
        prisma.student.findMany({
          select: {
            gpa: true,
            gender: true,
            departmentId: true,
            graduationDate: true,
            createdAt: true,
            certificateId: true
          },
          where: {
            gpa: { not: null }
          }
        }),

        // Grade distribution
        prisma.student.groupBy({
          by: ['grade'],
          _count: { grade: true },
          where: { grade: { not: null } }
        }),

        // Yearly registrations
        prisma.student.findMany({
          select: {
            createdAt: true,
            graduationDate: true
          }
        }),

        // Gender analysis by department
        prisma.student.groupBy({
          by: ['gender'],
          _count: { gender: true },
          where: {
            gender: { not: null }
          }
        }),

        // Certificate status analysis
        prisma.student.findMany({
          select: {
            certificateId: true,
            departmentId: true,
            graduationDate: true
          }
        }),

        // Academic year distribution
        prisma.academicYear.findMany({
          include: {
            _count: {
              select: { students: true }
            }
          }
        }),

        // Top performing students
        prisma.student.findMany({
          where: {
            gpa: { gte: 3.5 }
          },
          include: {
            department: {
              select: { name: true }
            },
            faculty: {
              select: { name: true }
            }
          },
          orderBy: {
            gpa: 'desc'
          },
          take: 10
        }),

        // Graduation trends
        prisma.student.findMany({
          where: {
            graduationDate: { not: null }
          },
          select: {
            graduationDate: true,
            departmentId: true,
            gpa: true
          }
        })
      ]);

      // Process department distribution
      const processedDepartments = departmentDistribution.map(dept => {
        const students = dept.students;
        const maleCount = students.filter(s => s.gender === 'MALE').length;
        const femaleCount = students.filter(s => s.gender === 'FEMALE').length;
        const certificateCount = students.filter(s => s.certificateId).length;
        const avgGPA = students.length > 0 
          ? students.reduce((sum, s) => sum + decimalToNumber(s.gpa), 0) / students.length 
          : 0;

        return {
          id: dept.id,
          name: dept.name,
          faculty: dept.faculty.name,
          totalStudents: dept._count.students,
          maleStudents: maleCount,
          femaleStudents: femaleCount,
          certificatesIssued: certificateCount,
          averageGPA: Math.round(avgGPA * 100) / 100,
          certificateRate: students.length > 0 ? Math.round((certificateCount / students.length) * 100) : 0
        };
      });

      // Process GPA distribution
      const gpaRanges = [
        { min: 3.5, max: 4.0, label: '3.5 - 4.0 (Excellent)' },
        { min: 3.0, max: 3.49, label: '3.0 - 3.5 (Good)' },
        { min: 2.5, max: 2.99, label: '2.5 - 3.0 (Satisfactory)' },
        { min: 2.0, max: 2.49, label: '2.0 - 2.5 (Needs Improvement)' },
        { min: 0, max: 1.99, label: 'Below 2.0 (Poor)' }
      ];

      const gpaDistribution = gpaRanges.map(range => {
        const count = gpaAnalysis.filter(student => {
          const gpa = decimalToNumber(student.gpa);
          return gpa >= range.min && gpa <= range.max;
        }).length;

        return {
          range: range.label,
          count,
          percentage: gpaAnalysis.length > 0 ? Math.round((count / gpaAnalysis.length) * 100) : 0
        };
      });

      // Process yearly admissions
      const yearlyData: { [key: string]: number } = {};
      yearlyAdmissions.forEach(student => {
        const year = student.createdAt.getFullYear().toString();
        yearlyData[year] = (yearlyData[year] || 0) + 1;
      });

      const yearlyAdmissionsData = Object.entries(yearlyData)
        .map(([year, count]) => ({ year, count }))
        .sort((a, b) => parseInt(a.year) - parseInt(b.year));

      // Process graduation trends
      const graduationData: { [key: string]: number } = {};
      graduationTrends.forEach(student => {
        if (student.graduationDate) {
          const year = student.graduationDate.getFullYear().toString();
          graduationData[year] = (graduationData[year] || 0) + 1;
        }
      });

      const graduationTrendsData = Object.entries(graduationData)
        .map(([year, count]) => ({ year, count }))
        .sort((a, b) => parseInt(a.year) - parseInt(b.year));

      // Certificate analysis
      const totalStudents = certificateStatus.length;
      const studentsWithCertificates = certificateStatus.filter(s => s.certificateId).length;
      const overallCertificateRate = totalStudents > 0 ? Math.round((studentsWithCertificates / totalStudents) * 100) : 0;

      // Prepare comprehensive report response
      const reportData = {
        summary: {
          totalStudents,
          totalDepartments: departmentDistribution.length,
          totalFaculties: facultyDistribution.length,
          averageGPA: gpaAnalysis.length > 0 
            ? Math.round((gpaAnalysis.reduce((sum, s) => sum + decimalToNumber(s.gpa), 0) / gpaAnalysis.length) * 100) / 100 
            : 0,
          certificateRate: overallCertificateRate
        },
        
        departmentAnalysis: {
          distribution: processedDepartments,
          topPerforming: processedDepartments
            .sort((a, b) => b.averageGPA - a.averageGPA)
            .slice(0, 5)
        },

        academicPerformance: {
          gpaDistribution,
          gradeDistribution: gradeDistribution.map(item => ({
            grade: item.grade,
            count: item._count.grade,
            percentage: totalStudents > 0 ? Math.round((item._count.grade / totalStudents) * 100) : 0
          })),
          topPerformers: topPerformers.map(student => ({
            name: student.fullName,
            registrationId: student.registrationId,
            gpa: decimalToNumber(student.gpa),
            department: student.department?.name || 'N/A',
            faculty: student.faculty?.name || 'N/A'
          }))
        },

        trends: {
          yearlyAdmissions: yearlyAdmissionsData,
          graduationTrends: graduationTrendsData,
          monthlyRegistrations: [] // Can be populated if needed
        },

        demographics: {
          genderDistribution: [
            {
              gender: 'Male',
              count: gpaAnalysis.filter(s => s.gender === 'MALE').length,
              percentage: gpaAnalysis.length > 0 ? Math.round((gpaAnalysis.filter(s => s.gender === 'MALE').length / gpaAnalysis.length) * 100) : 0
            },
            {
              gender: 'Female', 
              count: gpaAnalysis.filter(s => s.gender === 'FEMALE').length,
              percentage: gpaAnalysis.length > 0 ? Math.round((gpaAnalysis.filter(s => s.gender === 'FEMALE').length / gpaAnalysis.length) * 100) : 0
            }
          ]
        },

        certificates: {
          totalIssued: studentsWithCertificates,
          totalPending: totalStudents - studentsWithCertificates,
          issuanceRate: overallCertificateRate,
          byDepartment: processedDepartments.map(dept => ({
            department: dept.name,
            issued: dept.certificatesIssued,
            total: dept.totalStudents,
            rate: dept.certificateRate
          }))
        },

        lastUpdated: new Date().toISOString()
      };

      res.json({
        success: true,
        data: reportData
      });

    } catch (error) {
      console.error('Reports error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch reports data'
      });
    }
  }
} 