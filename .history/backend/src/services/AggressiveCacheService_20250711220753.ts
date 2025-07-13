/**
 * Aggressive Cache Service
 * Target: Minimize database hits to bypass 390ms connection latency
 * 
 * Strategy:
 * 1. Cache frequently accessed data for long periods
 * 2. Preload critical data in background
 * 3. Serve stale data while refreshing
 * 4. Use multiple cache layers
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
  expiresAt: number;
}

interface CacheConfig {
  ttl: number;          // Time to live in milliseconds
  maxSize: number;      // Maximum cache entries
  staleWhileRevalidate: number; // Serve stale data while refreshing
}

class AggressiveCacheService {
  private caches = new Map<string, Map<string, CacheEntry<any>>>();
  private configs = new Map<string, CacheConfig>();
  private refreshQueue = new Set<string>();

  constructor() {
    this.setupDefaultCaches();
    this.startBackgroundRefresh();
  }

  /**
   * Setup cache configurations for different data types
   */
  private setupDefaultCaches() {
    // User authentication cache (high frequency, critical for login)
    this.createCache('users', {
      ttl: 15 * 60 * 1000,        // 15 minutes
      maxSize: 1000,
      staleWhileRevalidate: 5 * 60 * 1000  // 5 minutes
    });

    // Student list cache (paginated results)
    this.createCache('students', {
      ttl: 10 * 60 * 1000,        // 10 minutes
      maxSize: 100,               // 100 different pages/filters
      staleWhileRevalidate: 3 * 60 * 1000  // 3 minutes
    });

    // Dashboard stats (changes infrequently)
    this.createCache('dashboard', {
      ttl: 30 * 60 * 1000,        // 30 minutes
      maxSize: 50,
      staleWhileRevalidate: 10 * 60 * 1000 // 10 minutes
    });

    // Audit logs (historical data, rarely changes)
    this.createCache('audit', {
      ttl: 20 * 60 * 1000,        // 20 minutes
      maxSize: 100,
      staleWhileRevalidate: 5 * 60 * 1000  // 5 minutes
    });

    // Academic data (departments, faculties - very stable)
    this.createCache('academic', {
      ttl: 60 * 60 * 1000,        // 1 hour
      maxSize: 50,
      staleWhileRevalidate: 30 * 60 * 1000 // 30 minutes
    });
  }

  /**
   * Create a named cache with specific configuration
   */
  createCache(name: string, config: CacheConfig): void {
    this.caches.set(name, new Map());
    this.configs.set(name, config);
  }

  /**
   * Get data from cache with stale-while-revalidate strategy
   */
  async get<T>(
    cacheName: string, 
    key: string, 
    fetchFunction: () => Promise<T>
  ): Promise<T> {
    const cache = this.caches.get(cacheName);
    const config = this.configs.get(cacheName);
    
    if (!cache || !config) {
      throw new Error(`Cache '${cacheName}' not found`);
    }

    const entry = cache.get(key);
    const now = Date.now();

    // Cache hit - return immediately if not expired
    if (entry && now < entry.expiresAt) {
      entry.hits++;
      console.log(`⚡ Cache HIT: ${cacheName}:${key} (${entry.hits} hits)`);
      return entry.data;
    }

    // Stale data available - return stale, refresh in background
    if (entry && now < entry.expiresAt + config.staleWhileRevalidate) {
      entry.hits++;
      console.log(`🔄 Cache STALE: ${cacheName}:${key} (serving stale, refreshing)`);
      
      // Refresh in background (don't await)
      this.refreshInBackground(cacheName, key, fetchFunction);
      
      return entry.data;
    }

    // Cache miss or completely stale - fetch fresh data
    console.log(`❌ Cache MISS: ${cacheName}:${key} (fetching fresh)`);
    const freshData = await fetchFunction();
    
    this.set(cacheName, key, freshData);
    
    return freshData;
  }

  /**
   * Set data in cache
   */
  set<T>(cacheName: string, key: string, data: T): void {
    const cache = this.caches.get(cacheName);
    const config = this.configs.get(cacheName);
    
    if (!cache || !config) {
      throw new Error(`Cache '${cacheName}' not found`);
    }

    // Evict old entries if cache is full
    if (cache.size >= config.maxSize) {
      this.evictOldest(cacheName);
    }

    const now = Date.now();
    cache.set(key, {
      data,
      timestamp: now,
      hits: 0,
      expiresAt: now + config.ttl
    });

    console.log(`💾 Cache SET: ${cacheName}:${key}`);
  }

  /**
   * Refresh data in background without blocking
   */
  private async refreshInBackground<T>(
    cacheName: string, 
    key: string, 
    fetchFunction: () => Promise<T>
  ): Promise<void> {
    const refreshKey = `${cacheName}:${key}`;
    
    // Prevent duplicate background refreshes
    if (this.refreshQueue.has(refreshKey)) {
      return;
    }

    this.refreshQueue.add(refreshKey);

    try {
      const freshData = await fetchFunction();
      this.set(cacheName, key, freshData);
      console.log(`🔄 Background refresh completed: ${refreshKey}`);
    } catch (error) {
      console.warn(`⚠️ Background refresh failed: ${refreshKey}`, error);
    } finally {
      this.refreshQueue.delete(refreshKey);
    }
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(cacheName: string, key: string): void {
    const cache = this.caches.get(cacheName);
    if (cache) {
      cache.delete(key);
      console.log(`🗑️ Cache invalidated: ${cacheName}:${key}`);
    }
  }

  /**
   * Invalidate entire cache
   */
  invalidateCache(cacheName: string): void {
    const cache = this.caches.get(cacheName);
    if (cache) {
      cache.clear();
      console.log(`🗑️ Cache cleared: ${cacheName}`);
    }
  }

  /**
   * Preload critical data to warm cache
   */
  async preloadCriticalData(): Promise<void> {
    console.log('🔥 Preloading critical data...');
    
    try {
      // Import these here to avoid circular dependencies
      const { prisma } = require('../lib/prisma');
      
      // Preload user data (for login optimization)
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          passwordHash: true,
          role: true,
          isActive: true,
          mustChangePassword: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true
        },
        take: 50 // Most recent/active users
      });

      users.forEach((user: any) => {
        this.set('users', user.email.toLowerCase(), user);
      });

      // Preload dashboard stats
      const [totalStudents, totalUsers] = await Promise.all([
        prisma.student.count(),
        prisma.user.count()
      ]);

      this.set('dashboard', 'basic_stats', {
        totalStudents,
        totalUsers,
        lastUpdated: new Date()
      });

      // Preload academic configuration
      const [departments, faculties] = await Promise.all([
        prisma.department.findMany({ 
          select: { id: true, name: true, code: true, facultyId: true }
        }),
        prisma.faculty.findMany({ 
          select: { id: true, name: true, code: true }
        })
      ]);

      this.set('academic', 'departments', departments);
      this.set('academic', 'faculties', faculties);

      console.log('✅ Critical data preloaded successfully');
    } catch (error) {
      console.error('❌ Failed to preload critical data:', error);
    }
  }

  /**
   * Evict oldest entries when cache is full
   */
  private evictOldest(cacheName: string): void {
    const cache = this.caches.get(cacheName);
    if (!cache) return;

    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      cache.delete(oldestKey);
      console.log(`🗑️ Evicted oldest cache entry: ${cacheName}:${oldestKey}`);
    }
  }

  /**
   * Background cache maintenance
   */
  private startBackgroundRefresh(): void {
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 5 * 60 * 1000);

    // Preload critical data every 30 minutes
    setInterval(() => {
      this.preloadCriticalData();
    }, 30 * 60 * 1000);
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let totalCleaned = 0;

    for (const [cacheName, cache] of this.caches.entries()) {
      const config = this.configs.get(cacheName);
      if (!config) continue;

      const keysToDelete: string[] = [];
      
      for (const [key, entry] of cache.entries()) {
        if (now > entry.expiresAt + config.staleWhileRevalidate) {
          keysToDelete.push(key);
        }
      }

      keysToDelete.forEach(key => cache.delete(key));
      totalCleaned += keysToDelete.length;
    }

    if (totalCleaned > 0) {
      console.log(`🧹 Cleaned up ${totalCleaned} expired cache entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): any {
    const stats: any = {};

    for (const [cacheName, cache] of this.caches.entries()) {
      const config = this.configs.get(cacheName);
      if (!config) continue;

      const entries = Array.from(cache.values());
      const now = Date.now();

      stats[cacheName] = {
        entries: cache.size,
        maxSize: config.maxSize,
        utilization: Math.round((cache.size / config.maxSize) * 100),
        totalHits: entries.reduce((sum, entry) => sum + entry.hits, 0),
        expired: entries.filter(entry => now > entry.expiresAt).length,
        stale: entries.filter(entry => 
          now > entry.expiresAt && now <= entry.expiresAt + config.staleWhileRevalidate
        ).length
      };
    }

    return {
      caches: stats,
      refreshQueue: this.refreshQueue.size,
      totalCacheSize: Array.from(this.caches.values())
        .reduce((sum, cache) => sum + cache.size, 0)
    };
  }
}

// Export singleton instance
export const aggressiveCache = new AggressiveCacheService();

// Start preloading critical data
aggressiveCache.preloadCriticalData();

export default aggressiveCache; 