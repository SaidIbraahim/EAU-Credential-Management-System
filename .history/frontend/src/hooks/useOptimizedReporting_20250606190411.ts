import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useDebounce } from './useDebounce';

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

interface StudentSearchParams {
  query?: string;
  status?: string;
  departmentId?: number;
  facultyId?: number;
  page?: number;
  limit?: number;
}

interface StudentSearchResult {
  students: any[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  key: string;
}

interface UseOptimizedReportingOptions {
  enableCache?: boolean;
  cacheTimeout?: number;
  enableDebounce?: boolean;
  debounceDelay?: number;
  enablePrefetch?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseOptimizedReportingReturn {
  // Dashboard data
  dashboardMetrics: DashboardMetrics | null;
  isDashboardLoading: boolean;
  dashboardError: string | null;
  refreshDashboard: () => Promise<void>;

  // Student search
  searchResults: StudentSearchResult | null;
  isSearchLoading: boolean;
  searchError: string | null;
  searchStudents: (params: StudentSearchParams) => Promise<void>;
  
  // Analytics
  analytics: any | null;
  isAnalyticsLoading: boolean;
  analyticsError: string | null;
  loadAnalytics: () => Promise<void>;

  // Cache management
  clearCache: () => void;
  getCacheStats: () => any;
  
  // Performance metrics
  performanceMetrics: {
    dashboardLoadTime: number;
    searchLoadTime: number;
    analyticsLoadTime: number;
    cacheHitRate: number;
  };
}

const DEFAULT_OPTIONS: UseOptimizedReportingOptions = {
  enableCache: true,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
  enableDebounce: true,
  debounceDelay: 300,
  enablePrefetch: true,
  autoRefresh: false,
  refreshInterval: 30 * 1000 // 30 seconds
};

export const useOptimizedReporting = (
  options: UseOptimizedReportingOptions = {}
): UseOptimizedReportingReturn => {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  // State management
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  
  const [searchResults, setSearchResults] = useState<StudentSearchResult | null>(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  // Performance tracking
  const [performanceMetrics, setPerformanceMetrics] = useState({
    dashboardLoadTime: 0,
    searchLoadTime: 0,
    analyticsLoadTime: 0,
    cacheHitRate: 0
  });

  // Cache and refs
  const cacheRef = useRef(new Map<string, CacheEntry<any>>());
  const abortControllerRef = useRef<AbortController | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cacheHitsRef = useRef(0);
  const cacheMissesRef = useRef(0);
  
  // Debounced search
  const [searchParams, setSearchParams] = useState<StudentSearchParams>({});
  const debouncedSearchParams = useDebounce(searchParams, config.debounceDelay!);

  /**
   * 🗄️ Cache management functions
   */
  const getCacheKey = useCallback((prefix: string, params?: any): string => {
    if (!params) return prefix;
    return `${prefix}_${JSON.stringify(params)}`;
  }, []);

  const getFromCache = useCallback(<T>(key: string): T | null => {
    if (!config.enableCache) return null;
    
    const entry = cacheRef.current.get(key);
    if (!entry) {
      cacheMissesRef.current++;
      return null;
    }

    const isExpired = Date.now() - entry.timestamp > config.cacheTimeout!;
    if (isExpired) {
      cacheRef.current.delete(key);
      cacheMissesRef.current++;
      return null;
    }

    cacheHitsRef.current++;
    console.log(`📊 Cache hit for: ${key}`);
    return entry.data as T;
  }, [config.enableCache, config.cacheTimeout]);

  const setCache = useCallback(<T>(key: string, data: T): void => {
    if (!config.enableCache) return;
    
    cacheRef.current.set(key, {
      data,
      timestamp: Date.now(),
      key
    });
  }, [config.enableCache]);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
    cacheHitsRef.current = 0;
    cacheMissesRef.current = 0;
    console.log('🧹 Cache cleared');
  }, []);

  const getCacheStats = useCallback(() => {
    const totalRequests = cacheHitsRef.current + cacheMissesRef.current;
    const hitRate = totalRequests > 0 ? (cacheHitsRef.current / totalRequests) * 100 : 0;
    
    return {
      size: cacheRef.current.size,
      hits: cacheHitsRef.current,
      misses: cacheMissesRef.current,
      hitRate: Math.round(hitRate * 100) / 100,
      keys: Array.from(cacheRef.current.keys())
    };
  }, []);

  /**
   * 🎯 API call with performance tracking
   */
  const makeApiCall = useCallback(async <T>(
    url: string, 
    options: RequestInit = {},
    performanceKey: keyof typeof performanceMetrics
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: abortControllerRef.current?.signal
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }

      const data = await response.json();
      const loadTime = performance.now() - startTime;
      
      setPerformanceMetrics(prev => ({
        ...prev,
        [performanceKey]: Math.round(loadTime * 100) / 100
      }));

      console.log(`⚡ ${url} loaded in ${loadTime.toFixed(2)}ms`);
      return data;
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error(`❌ API call failed for ${url}:`, error);
      }
      throw error;
    }
  }, []);

  /**
   * 📊 Load dashboard metrics with caching
   */
  const refreshDashboard = useCallback(async (): Promise<void> => {
    const cacheKey = 'dashboard_metrics';
    const cached = getFromCache<DashboardMetrics>(cacheKey);
    
    if (cached) {
      setDashboardMetrics(cached);
      return;
    }

    setIsDashboardLoading(true);
    setDashboardError(null);

    try {
      const data = await makeApiCall<DashboardMetrics>(
        '/api/reports/dashboard',
        {},
        'dashboardLoadTime'
      );
      
      setDashboardMetrics(data);
      setCache(cacheKey, data);
      
      // Prefetch related data if enabled
      if (config.enablePrefetch) {
        loadAnalytics().catch(console.warn);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setDashboardError(error.message || 'Failed to load dashboard metrics');
      }
    } finally {
      setIsDashboardLoading(false);
    }
  }, [getFromCache, setCache, makeApiCall, config.enablePrefetch]);

  /**
   * 🔍 Search students with optimization
   */
  const searchStudents = useCallback(async (params: StudentSearchParams): Promise<void> => {
    const cacheKey = getCacheKey('student_search', params);
    const cached = getFromCache<StudentSearchResult>(cacheKey);
    
    if (cached) {
      setSearchResults(cached);
      return;
    }

    setIsSearchLoading(true);
    setSearchError(null);

    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const data = await makeApiCall<StudentSearchResult>(
        `/api/students/search?${queryParams}`,
        {},
        'searchLoadTime'
      );
      
      setSearchResults(data);
      setCache(cacheKey, data);
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setSearchError(error.message || 'Search failed');
      }
    } finally {
      setIsSearchLoading(false);
    }
  }, [getCacheKey, getFromCache, setCache, makeApiCall]);

  /**
   * 📈 Load analytics data
   */
  const loadAnalytics = useCallback(async (): Promise<void> => {
    const cacheKey = 'analytics_data';
    const cached = getFromCache<any>(cacheKey);
    
    if (cached) {
      setAnalytics(cached);
      return;
    }

    setIsAnalyticsLoading(true);
    setAnalyticsError(null);

    try {
      const data = await makeApiCall<any>(
        '/api/reports/analytics',
        {},
        'analyticsLoadTime'
      );
      
      setAnalytics(data);
      setCache(cacheKey, data);
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setAnalyticsError(error.message || 'Failed to load analytics');
      }
    } finally {
      setIsAnalyticsLoading(false);
    }
  }, [getFromCache, setCache, makeApiCall]);

  /**
   * 🔄 Auto-refresh functionality
   */
  useEffect(() => {
    if (config.autoRefresh && config.refreshInterval) {
      refreshIntervalRef.current = setInterval(() => {
        console.log('🔄 Auto-refreshing dashboard...');
        refreshDashboard();
      }, config.refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [config.autoRefresh, config.refreshInterval, refreshDashboard]);

  /**
   * 🔍 Debounced search effect
   */
  useEffect(() => {
    if (Object.keys(debouncedSearchParams).length > 0) {
      searchStudents(debouncedSearchParams);
    }
  }, [debouncedSearchParams, searchStudents]);

  /**
   * 🧹 Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  /**
   * 📊 Update cache hit rate
   */
  useEffect(() => {
    const updateCacheHitRate = () => {
      const stats = getCacheStats();
      setPerformanceMetrics(prev => ({
        ...prev,
        cacheHitRate: stats.hitRate
      }));
    };

    const interval = setInterval(updateCacheHitRate, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [getCacheStats]);

  /**
   * 🚀 Initialize data loading
   */
  useEffect(() => {
    abortControllerRef.current = new AbortController();
    refreshDashboard();
  }, [refreshDashboard]);

  /**
   * 🎯 Optimized search function with debouncing
   */
  const optimizedSearchStudents = useCallback((params: StudentSearchParams) => {
    setSearchParams(params);
  }, []);

  /**
   * 📈 Memoized performance summary
   */
  const performanceSummary = useMemo(() => {
    const avgLoadTime = (
      performanceMetrics.dashboardLoadTime + 
      performanceMetrics.searchLoadTime + 
      performanceMetrics.analyticsLoadTime
    ) / 3;

    return {
      ...performanceMetrics,
      averageLoadTime: Math.round(avgLoadTime * 100) / 100,
      cacheEfficiency: performanceMetrics.cacheHitRate > 70 ? 'excellent' : 
                      performanceMetrics.cacheHitRate > 50 ? 'good' : 'needs_improvement'
    };
  }, [performanceMetrics]);

  return {
    // Dashboard
    dashboardMetrics,
    isDashboardLoading,
    dashboardError,
    refreshDashboard,

    // Search
    searchResults,
    isSearchLoading,
    searchError,
    searchStudents: optimizedSearchStudents,

    // Analytics
    analytics,
    isAnalyticsLoading,
    analyticsError,
    loadAnalytics,

    // Cache management
    clearCache,
    getCacheStats,

    // Performance metrics
    performanceMetrics: performanceSummary
  };
};

// Custom debounce hook
const useDebounce = (value: any, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}; 