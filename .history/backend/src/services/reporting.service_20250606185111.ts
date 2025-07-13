import { PrismaClient } from '@prisma/client';
import { cache } from '../utils/cache';

const prisma = new PrismaClient();

interface ReportingStats {
  totalStudents: number;
  clearedStudents: number;
  unclearedStudents: number;
  totalDocuments: number;
  departmentStats: Array<{
    name: string;
    count: number;
    clearedCount: number;
  }>;
  facultyStats: Array<{
    name: string;
    count: number;
    clearedCount: number;
  }>;
  monthlyRegistrations: Array<{
    month: string;
    count: number;
  }>;
  recentActivity: Array<{
    action: string;
    count: number;
    timestamp: Date;
  }>;
}

export class ReportingService {
  // ⚡ Ultra-fast dashboard stats with aggressive caching
  static async getDashboardStats(): Promise<ReportingStats> {
    const cacheKey = 'dashboard-stats';
    const cached = await cache.get(cacheKey);
    
    if (cached) {
      console.log('📊 Dashboard stats served from cache');
      return cached;
    }

    console.time('🔥 Dashboard Stats Generation');

    try {
      // ⚡ Parallel aggregation queries for maximum speed
      const [
        totalStudents,
        studentsByStatus,
        totalDocuments,
        departmentStats,
        facultyStats,
        monthlyRegistrations,
        recentActivity
      ] = await Promise.all([
        // Total students count
        prisma.student.count(),
        
        // Students by status (using aggregation)
        prisma.student.groupBy({
          by: ['status'],
          _count: true
        }),
        
        // Total documents count
        prisma.document.count(),
        
        // Department statistics
        prisma.student.groupBy({
          by: ['departmentId'],
          _count: true,
          include: {
            department: {
              select: { name: true }
            }
          }
        }),
        
        // Faculty statistics
        prisma.student.groupBy({
          by: ['facultyId'],
          _count: true,
          include: {
            faculty: {
              select: { name: true }
            }
          }
        }),
        
        // Monthly registrations (last 12 months)
        prisma.$queryRaw`
          SELECT 
            TO_CHAR(created_at, 'YYYY-MM') as month,
            COUNT(*)::integer as count
          FROM students 
          WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
          GROUP BY TO_CHAR(created_at, 'YYYY-MM')
          ORDER BY month DESC
          LIMIT 12
        `,
        
        // Recent activity from audit logs
        prisma.auditLog.groupBy({
          by: ['action'],
          _count: true,
          where: {
            timestamp: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          },
          orderBy: {
            _count: {
              action: 'desc'
            }
          },
          take: 10
        })
      ]);

      // ⚡ Process results efficiently
      const statusMap = studentsByStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>);

      const stats: ReportingStats = {
        totalStudents,
        clearedStudents: statusMap['CLEARED'] || 0,
        unclearedStudents: statusMap['UN_CLEARED'] || 0,
        totalDocuments,
        departmentStats: await this.enrichDepartmentStats(departmentStats),
        facultyStats: await this.enrichFacultyStats(facultyStats),
        monthlyRegistrations: monthlyRegistrations as any[],
        recentActivity: recentActivity.map(item => ({
          action: item.action,
          count: item._count,
          timestamp: new Date()
        }))
      };

      // Cache for 5 minutes
      await cache.set(cacheKey, stats, 300);
      
      console.timeEnd('🔥 Dashboard Stats Generation');
      console.log(`📊 Generated dashboard stats: ${totalStudents} students, ${totalDocuments} documents`);
      
      return stats;

    } catch (error) {
      console.error('❌ Error generating dashboard stats:', error);
      throw new Error('Failed to generate dashboard statistics');
    }
  }

  // ⚡ Fast student search with pagination and filtering
  static async searchStudents(filters: {
    search?: string;
    status?: string;
    departmentId?: number;
    facultyId?: number;
    page?: number;
    limit?: number;
  }) {
    console.time('🔍 Student Search');
    
    const {
      search,
      status,
      departmentId,
      facultyId,
      page = 1,
      limit = 20
    } = filters;

    const skip = (page - 1) * limit;

    // Build optimized where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { registrationId: { contains: search, mode: 'insensitive' } },
        { certificateId: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (status) where.status = status;
    if (departmentId) where.departmentId = departmentId;
    if (facultyId) where.facultyId = facultyId;

    try {
      const [students, total] = await Promise.all([
        prisma.student.findMany({
          where,
          skip,
          take: limit,
          select: {
            id: true,
            registrationId: true,
            certificateId: true,
            fullName: true,
            status: true,
            createdAt: true,
            department: {
              select: { name: true, code: true }
            },
            faculty: {
              select: { name: true, code: true }
            },
            academicYear: {
              select: { academicYear: true }
            },
            _count: {
              select: { documents: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.student.count({ where })
      ]);

      console.timeEnd('🔍 Student Search');
      
      return {
        students,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      };

    } catch (error) {
      console.error('❌ Student search error:', error);
      throw new Error('Failed to search students');
    }
  }

  // ⚡ Helper methods for enriching stats
  private static async enrichDepartmentStats(departmentStats: any[]) {
    const departmentIds = departmentStats.map(stat => stat.departmentId);
    const departments = await prisma.department.findMany({
      where: { id: { in: departmentIds } },
      select: { id: true, name: true }
    });

    const departmentMap = departments.reduce((acc, dept) => {
      acc[dept.id] = dept.name;
      return acc;
    }, {} as Record<number, string>);

    return departmentStats.map(stat => ({
      name: departmentMap[stat.departmentId] || 'Unknown',
      count: stat._count,
      clearedCount: 0 // Will be calculated separately if needed
    }));
  }

  private static async enrichFacultyStats(facultyStats: any[]) {
    const facultyIds = facultyStats.map(stat => stat.facultyId);
    const faculties = await prisma.faculty.findMany({
      where: { id: { in: facultyIds } },
      select: { id: true, name: true }
    });

    const facultyMap = faculties.reduce((acc, faculty) => {
      acc[faculty.id] = faculty.name;
      return acc;
    }, {} as Record<number, string>);

    return facultyStats.map(stat => ({
      name: facultyMap[stat.facultyId] || 'Unknown',
      count: stat._count,
      clearedCount: 0 // Will be calculated separately if needed
    }));
  }

  // ⚡ Clear reporting cache when data changes
  static async invalidateCache() {
    await cache.delete('dashboard-stats');
    console.log('🗑️ Reporting cache invalidated');
  }
} 