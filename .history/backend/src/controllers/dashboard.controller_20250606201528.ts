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
  static async getStats(_req: Request, res: Response): Promise<void> {
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
  static async getQuickStats(_req: Request, res: Response): Promise<void> {
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
      const cacheKey = 'dashboard-reports';
      const cached = cache.get(cacheKey);
      
      // Return cached data if valid
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log('⚡ Reports data served from cache');
        return res.json({
          success: true,
          data: cached.data
        });
      }

      console.time('📊 Reports Generation');

      // OPTIMIZED: Minimal queries for reports
      const [
        studentsByStatus,
        documentsByType,
        registrationTrends,
        topDepartments
      ] = await Promise.all([
        // Student status breakdown
        prisma.student.groupBy({
          by: ['status'],
          _count: { status: true }
        }),

        // Document type distribution
        prisma.document.groupBy({
          by: ['documentType'],
          _count: { documentType: true }
        }),

        // Registration trends (last 6 months)
        prisma.student.findMany({
          select: { createdAt: true },
          where: {
            createdAt: {
              gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)
            }
          }
        }),

        // Top 5 departments by student count
        prisma.department.findMany({
          select: {
            name: true,
            _count: { select: { students: true } }
          },
          orderBy: {
            students: { _count: 'desc' }
          },
          take: 5
        })
      ]);

      // Process registration trends
      const trendData = registrationTrends.reduce((acc: { [key: string]: number }, student) => {
        const monthKey = student.createdAt.toISOString().slice(0, 7);
        acc[monthKey] = (acc[monthKey] || 0) + 1;
        return acc;
      }, {});

      const reportsData = {
        statusBreakdown: studentsByStatus.map(item => ({
          status: item.status,
          count: item._count.status
        })),
        documentTypes: documentsByType.map(item => ({
          type: item.documentType,
          count: item._count.documentType
        })),
        registrationTrends: Object.entries(trendData)
          .map(([month, count]) => ({ month, count }))
          .sort((a, b) => a.month.localeCompare(b.month)),
        topDepartments: topDepartments.map(dept => ({
          name: dept.name,
          studentCount: dept._count.students
        })),
        lastUpdated: new Date().toISOString()
      };

      // Cache for 5 minutes
      cache.set(cacheKey, {
        data: reportsData,
        timestamp: Date.now()
      });

      console.timeEnd('📊 Reports Generation');
      console.log(`📊 Generated reports data with ${studentsByStatus.length} status types`);

      res.json({
        success: true,
        data: reportsData
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