import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// Simple in-memory cache for dashboard stats
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export class DashboardController {
  /**
   * Get comprehensive dashboard statistics - ULTRA OPTIMIZED VERSION
   */
  static async getStats(_req: Request, res: Response) {
    try {
      const cacheKey = 'dashboard-stats';
      const cached = cache.get(cacheKey);
      
      // Return cached data if valid
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log('⚡ Dashboard stats served from cache');
        res.json({
          success: true,
          data: cached.data
        });
        return;
      }

      console.time('🚀 Ultra Dashboard Stats');
      
      // Get current year for filtering
      const currentYear = new Date().getFullYear();
      const lastYear = currentYear - 1;
      const lastYearStart = new Date(`${lastYear}-01-01`);
      const currentYearStart = new Date(`${currentYear}-01-01`);
      const twelveMonthsAgo = new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000);

      // ULTRA OPTIMIZED: Use raw SQL for complex aggregations
      const [
        basicStats,
        departmentStats,
        gradeDistribution,
        monthlyTrends
      ] = await Promise.all([
        // Single raw SQL query for all basic stats
        prisma.$queryRaw`
          SELECT 
            COUNT(*)::int as total_students,
            COUNT(CASE WHEN gender = 'MALE' THEN 1 END)::int as male_students,
            COUNT(CASE WHEN gender = 'FEMALE' THEN 1 END)::int as female_students,
            COUNT(CASE WHEN certificate_id IS NOT NULL THEN 1 END)::int as certificates_issued,
            COUNT(CASE WHEN graduation_date >= ${lastYearStart} AND graduation_date < ${currentYearStart} THEN 1 END)::int as last_year_graduates,
            COUNT(CASE WHEN gpa = 4.0 THEN 1 END)::int as perfect_gpa_students,
            (SELECT COUNT(*)::int FROM departments) as total_departments,
            (SELECT COUNT(*)::int FROM faculties) as total_faculties
          FROM students
        `,
        
        // Optimized department stats with single query
        prisma.$queryRaw`
          SELECT 
            d.id,
            d.name,
            COUNT(s.id)::int as student_count,
            COALESCE(ROUND(AVG(s.gpa::numeric), 2), 0) as average_gpa
          FROM departments d
          LEFT JOIN students s ON d.id = s.department_id
          GROUP BY d.id, d.name
          ORDER BY student_count DESC
        `,

        // Grade distribution
        prisma.student.groupBy({
          by: ['grade'],
          _count: { grade: true },
          where: { grade: { not: null } }
        }),

        // Monthly trends with raw SQL for speed
        prisma.$queryRaw`
          SELECT 
            TO_CHAR(created_at, 'YYYY-MM') as month,
            COUNT(*)::int as count
          FROM students 
          WHERE created_at >= ${twelveMonthsAgo}
          GROUP BY TO_CHAR(created_at, 'YYYY-MM')
          ORDER BY month ASC
        `
      ]);

      // Extract data from results
      const stats = (basicStats as any[])[0];
      const totalStudents = stats.total_students;
      const maleStudents = stats.male_students;
      const femaleStudents = stats.female_students;
      const certificatesIssued = stats.certificates_issued;
      const lastYearGraduates = stats.last_year_graduates;
      const perfectGPAStudents = stats.perfect_gpa_students;
      const totalDepartments = stats.total_departments;
      const totalFaculties = stats.total_faculties;

      // Calculate percentages
      const malePercentage = totalStudents > 0 ? Math.round((maleStudents / totalStudents) * 100) : 0;
      const femalePercentage = totalStudents > 0 ? Math.round((femaleStudents / totalStudents) * 100) : 0;
      const certificatePercentage = totalStudents > 0 ? Math.round((certificatesIssued / totalStudents) * 100) : 0;

      // Find best performing department efficiently
      const bestDepartment = (departmentStats as any[]).length > 0 
        ? (departmentStats as any[]).reduce((best, dept) => 
            dept.average_gpa > best.average_gpa ? dept : best
          )
        : { name: 'N/A', average_gpa: 0 };

      // Prepare ultra-optimized response
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
          bestDepartment: {
            name: bestDepartment.name,
            avgGPA: Number(bestDepartment.average_gpa)
          },
          perfectGPACount: perfectGPAStudents
        },
        departments: (departmentStats as any[]).map(dept => ({
          id: dept.id,
          name: dept.name,
          studentCount: dept.student_count,
          averageGPA: Number(dept.average_gpa)
        })),
        trends: {
          monthlyRegistrations: (monthlyTrends as any[]).map(trend => ({
            month: trend.month,
            count: trend.count
          })),
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

      console.timeEnd('🚀 Ultra Dashboard Stats');
      console.log(`⚡ Generated dashboard stats: ${totalStudents} students, ${totalDepartments} departments (ULTRA FAST)`);

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
   * Get quick overview stats - LIGHTNING FAST VERSION
   */
  static async getQuickStats(_req: Request, res: Response) {
    try {
      const cacheKey = 'quick-stats';
      const cached = cache.get(cacheKey);
      
      // Return cached data if valid (shorter cache for quick stats)
      if (cached && Date.now() - cached.timestamp < 2 * 60 * 1000) { // 2 minutes
        console.log('⚡ Quick stats served from cache');
        res.json({
          success: true,
          data: cached.data
        });
        return;
      }

      console.time('⚡ Lightning Quick Stats');

      // LIGHTNING FAST: Single raw SQL query for all quick stats
      const [quickStatsResult] = await prisma.$queryRaw`
        SELECT 
          COUNT(*)::int as total_students,
          COUNT(CASE WHEN gender = 'MALE' THEN 1 END)::int as male_students,
          COUNT(CASE WHEN gender = 'FEMALE' THEN 1 END)::int as female_students,
          COUNT(CASE WHEN certificate_id IS NOT NULL THEN 1 END)::int as certificates_issued,
          COUNT(CASE WHEN graduation_date >= DATE_TRUNC('year', CURRENT_DATE) - INTERVAL '1 year' 
                     AND graduation_date < DATE_TRUNC('year', CURRENT_DATE) THEN 1 END)::int as last_year_graduates,
          COUNT(CASE WHEN gpa = 4.0 THEN 1 END)::int as perfect_gpa_students,
          (SELECT COUNT(*)::int FROM departments) as total_departments
        FROM students
      `;

      const stats = quickStatsResult as any;
      const totalStudents = stats.total_students;
      
      const malePercentage = totalStudents > 0 ? Math.round((stats.male_students / totalStudents) * 100) : 0;
      const femalePercentage = totalStudents > 0 ? Math.round((stats.female_students / totalStudents) * 100) : 0;
      const certificatePercentage = totalStudents > 0 ? Math.round((stats.certificates_issued / totalStudents) * 100) : 0;

      const quickStats = {
        totalStudents,
        totalDepartments: stats.total_departments,
        maleStudents: stats.male_students,
        femaleStudents: stats.female_students,
        malePercentage,
        femalePercentage,
        lastYearGraduates: stats.last_year_graduates,
        certificatesIssued: stats.certificates_issued,
        certificatePercentage,
        perfectGPAStudents: stats.perfect_gpa_students
      };

      // Cache for 2 minutes
      cache.set(cacheKey, {
        data: quickStats,
        timestamp: Date.now()
      });

      console.timeEnd('⚡ Lightning Quick Stats');
      console.log(`⚡ Generated quick stats: ${totalStudents} students (LIGHTNING FAST)`);

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
   * Get comprehensive reports data for Reports page - OPTIMIZED
   */
  static async getReports(_req: Request, res: Response) {
    try {
      const cacheKey = 'dashboard-reports';
      const cached = cache.get(cacheKey);
      
      // Return cached data if valid
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log('⚡ Reports data served from cache');
        res.json({
          success: true,
          data: cached.data
        });
        return;
      }

      console.time('📊 Reports Generation');

      // OPTIMIZED: Minimal queries for reports using raw SQL
      const [
        statusBreakdown,
        documentTypes,
        registrationTrends,
        topDepartments
      ] = await Promise.all([
        // Student status breakdown
        prisma.$queryRaw`
          SELECT status, COUNT(*)::int as count
          FROM students
          GROUP BY status
        `,

        // Document type distribution
        prisma.$queryRaw`
          SELECT document_type as type, COUNT(*)::int as count
          FROM documents
          GROUP BY document_type
        `,

        // Registration trends (last 6 months)
        prisma.$queryRaw`
          SELECT 
            TO_CHAR(created_at, 'YYYY-MM') as month,
            COUNT(*)::int as count
          FROM students 
          WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
          GROUP BY TO_CHAR(created_at, 'YYYY-MM')
          ORDER BY month ASC
        `,

        // Top 5 departments by student count
        prisma.$queryRaw`
          SELECT 
            d.name,
            COUNT(s.id)::int as student_count
          FROM departments d
          LEFT JOIN students s ON d.id = s.department_id
          GROUP BY d.name
          ORDER BY student_count DESC
          LIMIT 5
        `
      ]);

      const reportsData = {
        statusBreakdown: (statusBreakdown as any[]).map(item => ({
          status: item.status,
          count: item.count
        })),
        documentTypes: (documentTypes as any[]).map(item => ({
          type: item.type,
          count: item.count
        })),
        registrationTrends: (registrationTrends as any[]).map(item => ({
          month: item.month,
          count: item.count
        })),
        topDepartments: (topDepartments as any[]).map(dept => ({
          name: dept.name,
          studentCount: dept.student_count
        })),
        lastUpdated: new Date().toISOString()
      };

      // Cache for 5 minutes
      cache.set(cacheKey, {
        data: reportsData,
        timestamp: Date.now()
      });

      console.timeEnd('📊 Reports Generation');
      console.log(`📊 Generated reports data with ${(statusBreakdown as any[]).length} status types (OPTIMIZED)`);

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