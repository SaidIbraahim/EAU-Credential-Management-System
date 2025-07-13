import { PrismaClient } from '@prisma/client';
// Performance monitoring handled by PerformanceMonitoringService

interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  key: string;
}

interface DashboardMetrics {
  totalStudents: number;
  clearedStudents: number;
  unclearedStudents: number;
  totalDocuments: number;
  recentRegistrations: any[];
  departmentBreakdown: any[];
  statusDistribution: any[];
  documentTypeStats: any[];
  monthlyRegistrations: any[];
}

interface StudentSearchResult {
  students: any[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

class ReportingService {
  private static instance: ReportingService;
  private cache = new Map<string, CacheEntry<any>>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache
  private readonly SHORT_CACHE_TTL = 30 * 1000; // 30 seconds for frequently changing data

  private constructor(private prisma: PrismaClient) {}

  static getInstance(prisma: PrismaClient): ReportingService {
    if (!ReportingService.instance) {
      ReportingService.instance = new ReportingService(prisma);
    }
    return ReportingService.instance;
  }

  /**
   * 🚀 Get comprehensive dashboard metrics with aggressive caching
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const cacheKey = 'dashboard_metrics';
    const cached = this.getFromCache<DashboardMetrics>(cacheKey);
    
    if (cached) {
      console.log('📊 Dashboard metrics served from cache');
      return cached;
    }

    console.time('⚡ Dashboard Metrics Generation');
    
    try {
      // Parallel execution of all dashboard queries for maximum performance
      const [
        totalStudents,
        clearedStudents,
        unclearedStudents,
        totalDocuments,
        recentRegistrations,
        departmentBreakdown,
        statusDistribution,
        documentTypeStats,
        monthlyRegistrations
      ] = await Promise.all([
        // 1. Total students count (optimized with count)
        this.prisma.student.count(),
        
        // 2. Cleared students count (partial index optimized)
        this.prisma.student.count({
          where: { status: 'CLEARED' }
        }),
        
        // 3. Uncleared students count (partial index optimized)
        this.prisma.student.count({
          where: { status: 'UN_CLEARED' }
        }),
        
        // 4. Total documents count
        this.prisma.document.count(),
        
        // 5. Recent registrations (limited and indexed on created_at)
        this.prisma.student.findMany({
          select: {
            id: true,
            registrationId: true,
            fullName: true,
            status: true,
            createdAt: true,
            department: {
              select: { name: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }),
        
        // 6. Department breakdown (aggregated query)
        this.prisma.student.groupBy({
          by: ['departmentId'],
          _count: { id: true },
          include: {
            department: {
              select: { name: true }
            }
          }
        }),
        
        // 7. Status distribution (aggregated)
        this.prisma.student.groupBy({
          by: ['status'],
          _count: { id: true }
        }),
        
        // 8. Document type statistics
        this.prisma.document.groupBy({
          by: ['documentType'],
          _count: { id: true }
        }),
        
        // 9. Monthly registrations trend (last 6 months)
        this.getMonthlyRegistrationsTrend()
      ]);

      const metrics: DashboardMetrics = {
        totalStudents,
        clearedStudents,
        unclearedStudents,
        totalDocuments,
        recentRegistrations,
        departmentBreakdown: departmentBreakdown.map(item => ({
          departmentId: item.departmentId,
          count: item._count.id,
          department: (item as any).department
        })),
        statusDistribution: statusDistribution.map(item => ({
          status: item.status,
          count: item._count.id,
          percentage: Math.round((item._count.id / totalStudents) * 100)
        })),
        documentTypeStats: documentTypeStats.map(item => ({
          type: item.documentType,
          count: item._count.id
        })),
        monthlyRegistrations
      };

      this.setCache(cacheKey, metrics, this.CACHE_TTL);
      console.timeEnd('⚡ Dashboard Metrics Generation');
      
      return metrics;
    } catch (error) {
      console.error('❌ Dashboard metrics generation failed:', error);
      console.timeEnd('⚡ Dashboard Metrics Generation');
      throw error;
    }
  }

  /**
   * 🔍 Optimized student search with pagination and filtering
   */
  async searchStudents(params: {
    query?: string;
    status?: string;
    departmentId?: number;
    facultyId?: number;
    page?: number;
    limit?: number;
  }): Promise<StudentSearchResult> {
    const {
      query = '',
      status,
      departmentId,
      facultyId,
      page = 1,
      limit = 20
    } = params;

    const offset = (page - 1) * limit;
    const cacheKey = `student_search_${JSON.stringify(params)}`;
    const cached = this.getFromCache<StudentSearchResult>(cacheKey);
    
    if (cached) {
      console.log('🔍 Student search served from cache');
      return cached;
    }

    console.time('⚡ Student Search');

    try {
      // Build optimized where clause
      const whereClause: any = {};
      
      // Full-text search optimization
      if (query) {
        whereClause.OR = [
          { fullName: { contains: query, mode: 'insensitive' } },
          { registrationId: { contains: query, mode: 'insensitive' } },
          { certificateId: { contains: query, mode: 'insensitive' } }
        ];
      }
      
      // Indexed filter conditions
      if (status) whereClause.status = status;
      if (departmentId) whereClause.departmentId = departmentId;
      if (facultyId) whereClause.facultyId = facultyId;

      // Parallel execution of search and count
      const [students, total] = await Promise.all([
        this.prisma.student.findMany({
          where: whereClause,
          select: {
            id: true,
            registrationId: true,
            certificateId: true,
            fullName: true,
            status: true,
            createdAt: true,
            department: {
              select: { name: true }
            },
            faculty: {
              select: { name: true }
            },
            _count: {
              select: { documents: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit
        }),
        
        this.prisma.student.count({ where: whereClause })
      ]);

      const result: StudentSearchResult = {
        students,
        total,
        page,
        limit,
        hasNext: offset + limit < total,
        hasPrev: page > 1
      };

      this.setCache(cacheKey, result, this.SHORT_CACHE_TTL);
      console.timeEnd('⚡ Student Search');
      
      return result;
    } catch (error) {
      console.error('❌ Student search failed:', error);
      console.timeEnd('⚡ Student Search');
      throw error;
    }
  }

  /**
   * 📊 Get detailed student analytics
   */
  async getStudentAnalytics() {
    const cacheKey = 'student_analytics';
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      console.log('📊 Student analytics served from cache');
      return cached;
    }

    console.time('⚡ Student Analytics');

    try {
      const [
        statusBreakdown,
        departmentStats,
        facultyStats,
        gpaDistribution,
        registrationTrends
      ] = await Promise.all([
        // Status breakdown with percentages
        this.prisma.student.groupBy({
          by: ['status'],
          _count: { id: true },
          _avg: { gpa: true }
        }),

        // Department performance
        this.prisma.student.groupBy({
          by: ['departmentId'],
          _count: { id: true },
          _avg: { gpa: true },
          include: {
            department: {
              select: { name: true, code: true }
            }
          }
        }),

        // Faculty statistics
        this.prisma.student.groupBy({
          by: ['facultyId'],
          _count: { id: true },
          _avg: { gpa: true },
          include: {
            faculty: {
              select: { name: true, code: true }
            }
          }
        }),

        // GPA distribution
        this.getGpaDistribution(),

        // Registration trends (last 12 months)
        this.getRegistrationTrends(12)
      ]);

      const analytics = {
        statusBreakdown: statusBreakdown.map(item => ({
          status: item.status,
          count: item._count.id,
          averageGpa: item._avg.gpa ? Number(item._avg.gpa.toFixed(2)) : null
        })),
        departmentStats: departmentStats.map(item => ({
          departmentId: item.departmentId,
          count: item._count.id,
          averageGpa: item._avg.gpa ? Number(item._avg.gpa.toFixed(2)) : null,
          department: (item as any).department
        })),
        facultyStats: facultyStats.map(item => ({
          facultyId: item.facultyId,
          count: item._count.id,
          averageGpa: item._avg.gpa ? Number(item._avg.gpa.toFixed(2)) : null,
          faculty: (item as any).faculty
        })),
        gpaDistribution,
        registrationTrends
      };

      this.setCache(cacheKey, analytics, this.CACHE_TTL);
      console.timeEnd('⚡ Student Analytics');
      
      return analytics;
    } catch (error) {
      console.error('❌ Student analytics failed:', error);
      console.timeEnd('⚡ Student Analytics');
      throw error;
    }
  }

  /**
   * 📄 Get document statistics and insights
   */
  async getDocumentInsights() {
    const cacheKey = 'document_insights';
    const cached = this.getFromCache(cacheKey);
    
    if (cached) return cached;

    console.time('⚡ Document Insights');

    try {
      const [
        documentTypeStats,
        uploadTrends,
        sizeAnalysis,
        completionRates
      ] = await Promise.all([
        // Document type distribution
        this.prisma.document.groupBy({
          by: ['documentType'],
          _count: { id: true },
          _avg: { fileSize: true },
          _sum: { fileSize: true }
        }),

        // Upload trends (last 6 months)
        this.getDocumentUploadTrends(),

        // File size analysis
        this.getFileSizeAnalysis(),

        // Document completion rates by student
        this.getDocumentCompletionRates()
      ]);

      const insights = {
        documentTypeStats: documentTypeStats.map(item => ({
          type: item.documentType,
          count: item._count.id,
          averageSize: item._avg.fileSize ? Math.round(item._avg.fileSize / 1024) : 0, // KB
          totalSize: item._sum.fileSize ? Math.round(item._sum.fileSize / (1024 * 1024)) : 0 // MB
        })),
        uploadTrends,
        sizeAnalysis,
        completionRates
      };

      this.setCache(cacheKey, insights, this.CACHE_TTL);
      console.timeEnd('⚡ Document Insights');
      
      return insights;
    } catch (error) {
      console.error('❌ Document insights failed:', error);
      console.timeEnd('⚡ Document Insights');
      throw error;
    }
  }

  /**
   * 📈 Get monthly registration trends
   */
  private async getMonthlyRegistrationsTrend(): Promise<any[]> {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    return this.prisma.student.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: sixMonthsAgo }
      },
      _count: { id: true },
      orderBy: { createdAt: 'asc' }
    });
  }

  /**
   * 📊 Get GPA distribution analysis
   */
  private async getGpaDistribution(): Promise<any[]> {
    const gpaRanges = [
      { min: 0, max: 2.0, label: '0.0 - 2.0' },
      { min: 2.0, max: 2.5, label: '2.0 - 2.5' },
      { min: 2.5, max: 3.0, label: '2.5 - 3.0' },
      { min: 3.0, max: 3.5, label: '3.0 - 3.5' },
      { min: 3.5, max: 4.0, label: '3.5 - 4.0' }
    ];

    const distribution = await Promise.all(
      gpaRanges.map(async (range) => {
        const count = await this.prisma.student.count({
          where: {
            gpa: {
              gte: range.min,
              lt: range.max
            }
          }
        });
        return { ...range, count };
      })
    );

    return distribution;
  }

  /**
   * 📈 Get registration trends for specified months
   */
  private async getRegistrationTrends(months: number): Promise<any[]> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    return this.prisma.student.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: startDate }
      },
      _count: { id: true },
      orderBy: { createdAt: 'asc' }
    });
  }

  /**
   * 📄 Get document upload trends
   */
  private async getDocumentUploadTrends(): Promise<any[]> {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    return this.prisma.document.groupBy({
      by: ['uploadDate'],
      where: {
        uploadDate: { gte: sixMonthsAgo }
      },
      _count: { id: true },
      orderBy: { uploadDate: 'asc' }
    });
  }

  /**
   * 📊 Analyze file sizes
   */
  private async getFileSizeAnalysis(): Promise<any> {
    const result = await this.prisma.document.aggregate({
      _avg: { fileSize: true },
      _max: { fileSize: true },
      _min: { fileSize: true },
      _sum: { fileSize: true },
      _count: { id: true }
    });

    return {
      averageSize: result._avg.fileSize ? Math.round(result._avg.fileSize / 1024) : 0, // KB
      maxSize: result._max.fileSize ? Math.round(result._max.fileSize / (1024 * 1024)) : 0, // MB
      minSize: result._min.fileSize ? Math.round(result._min.fileSize / 1024) : 0, // KB
      totalSize: result._sum.fileSize ? Math.round(result._sum.fileSize / (1024 * 1024)) : 0, // MB
      totalDocuments: result._count.id
    };
  }

  /**
   * ✅ Get document completion rates
   */
  private async getDocumentCompletionRates(): Promise<any> {
    const requiredDocTypes = ['PHOTO', 'TRANSCRIPT', 'CERTIFICATE']; // Assuming these are required
    
    const totalStudents = await this.prisma.student.count();
    const studentsWithAllDocs = await this.prisma.student.count({
      where: {
        documents: {
          some: {
            documentType: { in: requiredDocTypes }
          }
        }
      }
    });

    return {
      totalStudents,
      studentsWithAllDocs,
      completionRate: totalStudents > 0 ? Math.round((studentsWithAllDocs / totalStudents) * 100) : 0,
      incompleteStudents: totalStudents - studentsWithAllDocs
    };
  }

  /**
   * 🗑️ Cache management methods
   */
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp.getTime() > this.CACHE_TTL;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  private setCache<T>(key: string, data: T, ttl: number = this.CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: new Date(),
      key
    });
  }

  /**
   * 🧹 Clear specific cache entry or all cache
   */
  clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
      console.log(`🧹 Cleared cache for key: ${key}`);
    } else {
      this.cache.clear();
      console.log('🧹 Cleared all cache entries');
    }
  }

  /**
   * 📊 Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      ttl: this.CACHE_TTL
    };
  }

  /**
   * 🔄 Invalidate cache on data changes
   */
  invalidateRelatedCache(operation: 'student' | 'document' | 'audit'): void {
    const keysToInvalidate: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (operation === 'student' && (key.includes('student') || key.includes('dashboard'))) {
        keysToInvalidate.push(key);
      } else if (operation === 'document' && (key.includes('document') || key.includes('dashboard'))) {
        keysToInvalidate.push(key);
      }
    });

    keysToInvalidate.forEach(key => this.cache.delete(key));
    if (keysToInvalidate.length > 0) {
      console.log(`🔄 Invalidated ${keysToInvalidate.length} cache entries for ${operation} operation`);
    }
  }
}

export default ReportingService; 