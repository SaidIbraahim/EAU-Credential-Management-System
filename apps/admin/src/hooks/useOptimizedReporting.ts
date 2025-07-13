import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface ReportingState {
  dashboardStats: any;
  studentSearch: any;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface SearchFilters {
  search?: string;
  status?: string;
  departmentId?: number;
  facultyId?: number;
  page?: number;
  limit?: number;
}

export const useOptimizedReporting = () => {
  const [state, setState] = useState<ReportingState>({
    dashboardStats: null,
    studentSearch: null,
    isLoading: false,
    error: null,
    lastUpdated: null
  });

  const cacheRef = useRef(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  // ⚡ Optimized dashboard stats loading with caching
  const loadDashboardStats = useCallback(async (forceRefresh = false) => {
    const cacheKey = 'dashboard-stats';
    const cached = cacheRef.current.get(cacheKey);
    
    // Return cached data if available and not forcing refresh
    if (cached && !forceRefresh && Date.now() - cached.timestamp < 300000) { // 5 minutes
      setState(prev => ({
        ...prev,
        dashboardStats: cached.data,
        lastUpdated: cached.timestamp
      }));
      return cached.data;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.time('📊 Dashboard Stats Load');
      
      // Cancel previous request if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      const response = await fetch('/api/reporting/dashboard-stats', {
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Cache the results
      cacheRef.current.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      setState(prev => ({
        ...prev,
        dashboardStats: data,
        isLoading: false,
        lastUpdated: new Date()
      }));
      
      console.timeEnd('📊 Dashboard Stats Load');
      return data;
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return; // Request was cancelled
      }
      
      console.error('❌ Dashboard stats loading error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load dashboard statistics'
      }));
      
      toast.error('Failed to load dashboard statistics');
    }
  }, []);

  // ⚡ Optimized student search with debouncing and caching
  const searchStudents = useCallback(async (filters: SearchFilters) => {
    const cacheKey = `student-search-${JSON.stringify(filters)}`;
    const cached = cacheRef.current.get(cacheKey);
    
    // Return cached search results if available (cache for 2 minutes)
    if (cached && Date.now() - cached.timestamp < 120000) {
      setState(prev => ({
        ...prev,
        studentSearch: cached.data
      }));
      return cached.data;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.time('🔍 Student Search');
      
      // Cancel previous search if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
      
      const response = await fetch(`/api/reporting/students?${queryParams}`, {
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Cache search results
      cacheRef.current.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      setState(prev => ({
        ...prev,
        studentSearch: data,
        isLoading: false
      }));
      
      console.timeEnd('🔍 Student Search');
      return data;
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return; // Request was cancelled
      }
      
      console.error('❌ Student search error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to search students'
      }));
      
      toast.error('Failed to search students');
    }
  }, []);

  // ⚡ Real-time updates with WebSocket (optional enhancement)
  const enableRealTimeUpdates = useCallback(() => {
    // This could be expanded to use WebSocket for real-time updates
    const interval = setInterval(() => {
      loadDashboardStats(true);
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [loadDashboardStats]);

  // ⚡ Cache management
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
    console.log('🗑️ Reporting cache cleared');
  }, []);

  const getCacheStats = useCallback(() => {
    return {
      size: cacheRef.current.size,
      keys: Array.from(cacheRef.current.keys())
    };
  }, []);

  // ⚡ Prefetch common data
  const prefetchCommonData = useCallback(async () => {
    const commonSearches = [
      { status: 'CLEARED' },
      { status: 'UN_CLEARED' },
      { page: 1, limit: 20 }
    ];

    const prefetchPromises = commonSearches.map(filters => 
      searchStudents(filters).catch(err => console.warn('Prefetch failed:', err))
    );

    await Promise.all(prefetchPromises);
    console.log('🚀 Common data prefetched');
  }, [searchStudents]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    loadDashboardStats,
    searchStudents,
    enableRealTimeUpdates,
    clearCache,
    getCacheStats,
    prefetchCommonData,
    
    // Computed properties
    isDataStale: state.lastUpdated ? Date.now() - state.lastUpdated.getTime() > 300000 : true,
    cacheSize: cacheRef.current.size
  };
}; 