import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

// Simple in-memory cache for dashboard stats
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export class DashboardController {
  /**
   * Get comprehensive dashboard statistics - OPTIMIZED VERSION
   */
  static async getStats(_req: Request, res: Response) {
    try {
      const cacheKey = 'dashboard-stats';
      const cached = cache.get(cacheKey);
      
      // Return cached data if valid
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log('⚡ Dashboard stats served from cache');
        return res.json({
          success: true,
          data: cached.data
        });
      }

      console.time('🔥 Dashboard Stats Generation');
      
      // Get current year for filtering
      const currentYear = new Date().getFullYear();
      const lastYear = currentYear - 1;
      const lastYearStart = new Date(`${lastYear}-01-01`);
      const currentYearStart = new Date(`${currentYear}-01-01`);
      const twelveMonthsAgo = new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000);

      // OPTIMIZED: Single query with aggregations instead of multiple counts
      const [
        studentAggregations,
        basicCounts,
        departmentStats,
        gradeDistribution,
        monthlyRegistrations
      ] = await Promise.all([
        // Single query for student-related aggregations
        prisma.student.aggregate({
          _count: {
            id: true,
            certificateId: true
          },
          where: {}
        }),
        
        // Parallel basic counts
        Promise.all([
          prisma.student.count({ where: { gender: 'MALE' } }),
          prisma.student.count({ where: { gender: 'FEMALE' } }),
          prisma.student.count({ 
            where: { 
              graduationDate: { gte: lastYearStart, lt: currentYearStart }
            }
          }),
          prisma.student.count({ where: { gpa: 4.0 } }),
          prisma.department.count(),
          prisma.faculty.count()
        ]),

        // OPTIMIZED: Department stats with single query
        prisma.department.findMany({
          select: {
            id: true,
            name: true,
            _count: {
              select: { students: true }
            },
            students: {
              select: { gpa: true },
              where: { gpa: { not: null } }
            }
          }
        }),

        // Grade distribution
        prisma.student.groupBy({
          by: ['grade'],
          _count: { grade: true },
          where: { grade: { not: null } }
        }),

        // OPTIMIZED: Monthly registrations with efficient query
        prisma.student.findMany({
          select: { createdAt: true },
          where: { createdAt: { gte: twelveMonthsAgo } }
        })
      ]);

      // Extract aggregated data
      const totalStudents = studentAggregations._count.id;
      const certificatesIssued = studentAggregations._count.certificateId || 0;
      const [maleStudents, femaleStudents, lastYearGraduates, perfectGPAStudents, totalDepartments, totalFaculties] = basicCounts;

      // Process monthly data efficiently
      const monthlyData = monthlyRegistrations.reduce((acc: { [key: string]: number }, student) => {
        const monthKey = student.createdAt.toISOString().slice(0, 7);
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

      // Calculate percentages
      const malePercentage = totalStudents > 0 ? Math.round((maleStudents / totalStudents) * 100) : 0;
      const femalePercentage = totalStudents > 0 ? Math.round((femaleStudents / totalStudents) * 100) : 0;
      const certificatePercentage = totalStudents > 0 ? Math.round((certificatesIssued / totalStudents) * 100) : 0;

      // Find best performing department efficiently
      let bestDepartment = { name: 'N/A', avgGPA: 0 };
      let highestAvgGPA = 0;

      departmentStats.forEach(dept => {
        if (dept.students.length > 0) {
          const validGPAs = dept.students.map(s => decimalToNumber(s.gpa));
          const avgGPA = validGPAs.reduce((sum, gpa) => sum + gpa, 0) / validGPAs.length;
          if (avgGPA > highestAvgGPA) {
            highestAvgGPA = avgGPA;
            bestDepartment = {
              name: dept.name,
              avgGPA: Math.round(avgGPA * 100) / 100
            };
          }
        }
      });

      // Prepare optimized response
      const statistics = {
        overview: {
          totalStudents,
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
          bestDepartment,
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

      // Cache the result
      cache.set(cacheKey, {
        data: statistics,
        timestamp: Date.now()
      });

      console.timeEnd('🔥 Dashboard Stats Generation');
      console.log(`📊 Generated dashboard stats: ${totalStudents} students, ${totalDepartments} departments`);

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
   * Get quick overview stats - SUPER OPTIMIZED VERSION
   */
  static async getQuickStats(_req: Request, res: Response) {
    try {
      const cacheKey = 'quick-stats';
      const cached = cache.get(cacheKey);
      
      // Return cached data if valid (shorter cache for quick stats)
      if (cached && Date.now() - cached.timestamp < 2 * 60 * 1000) { // 2 minutes
        console.log('⚡ Quick stats served from cache');
        return res.json({
          success: true,
          data: cached.data
        });
      }

      console.time('🚀 Quick Stats Generation');

      const currentYear = new Date().getFullYear();
      const lastYearStart = new Date(`${currentYear - 1}-01-01`);
      const currentYearStart = new Date(`${currentYear}-01-01`);

      // SUPER OPTIMIZED: Single query with all aggregations
      const [studentStats, departmentCount] = await Promise.all([
        prisma.student.aggregate({
          _count: {
            id: true,
            certificateId: true
          },
          where: {}
        }),
        prisma.department.count()
      ]);

      // Parallel gender and special counts
      const [maleStudents, femaleStudents, lastYearGraduates, perfectGPAStudents] = await Promise.all([
        prisma.student.count({ where: { gender: 'MALE' } }),
        prisma.student.count({ where: { gender: 'FEMALE' } }),
        prisma.student.count({
          where: {
            graduationDate: { gte: lastYearStart, lt: currentYearStart }
          }
        }),
        prisma.student.count({ where: { gpa: 4.0 } })
      ]);

      const totalStudents = studentStats._count.id;
      const certificatesIssued = studentStats._count.certificateId || 0;
      
      const malePercentage = totalStudents > 0 ? Math.round((maleStudents / totalStudents) * 100) : 0;
      const femalePercentage = totalStudents > 0 ? Math.round((femaleStudents / totalStudents) * 100) : 0;
      const certificatePercentage = totalStudents > 0 ? Math.round((certificatesIssued / totalStudents) * 100) : 0;

      const quickStats = {
        totalStudents,
        totalDepartments: departmentCount,
        maleStudents,
        femaleStudents,
        malePercentage,
        femalePercentage,
        lastYearGraduates,
        certificatesIssued,
        certificatePercentage,
        perfectGPAStudents
      };

      // Cache for 2 minutes
      cache.set(cacheKey, {
        data: quickStats,
        timestamp: Date.now()
      });

      console.timeEnd('🚀 Quick Stats Generation');
      console.log(`⚡ Generated quick stats: ${totalStudents} students in ${departmentCount} departments`);

      res.json({
        success: true,
        data: quickStats
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
        certificateStatus,
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

        // Certificate status analysis
        prisma.student.findMany({
          select: {
            certificateId: true,
            departmentId: true,
            graduationDate: true
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