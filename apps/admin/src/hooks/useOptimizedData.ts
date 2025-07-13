import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
  isStale?: boolean;
}

interface UseOptimizedDataOptions {
  cacheKey: string;
  cacheExpiry?: number; // in milliseconds
  staleWhileRevalidate?: boolean;
  backgroundRefresh?: boolean;
  retryOnError?: boolean;
}

// Global cache and ongoing requests tracking
const cache = new Map<string, CacheItem<any>>();
const ongoingRequests = new Map<string, Promise<any>>();
const requestTimestamps = new Map<string, number>();

// Background refresh queue
const backgroundRefreshQueue = new Set<string>();
let backgroundRefreshInterval: NodeJS.Timeout | null = null;

// Start background refresh processor
const startBackgroundRefresh = () => {
  if (backgroundRefreshInterval) return;
  
  backgroundRefreshInterval = setInterval(async () => {
    if (backgroundRefreshQueue.size === 0) return;
    
    const keysToRefresh = Array.from(backgroundRefreshQueue);
    backgroundRefreshQueue.clear();
    
    // Process up to 3 background refreshes at a time
    const batch = keysToRefresh.slice(0, 3);
    
    await Promise.allSettled(
      batch.map(async (key) => {
        const cachedItem = cache.get(key);
        if (cachedItem && cachedItem.isStale) {
          // Find the corresponding fetch function and refresh
          // This will be handled by individual hook instances
        }
      })
    );
  }, 1000); // Process every second
};

export function useOptimizedData<T>(
  fetchFunction: () => Promise<T>,
  options: UseOptimizedDataOptions
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);
  const fetchFunctionRef = useRef(fetchFunction);
  
  const { 
    cacheKey, 
    cacheExpiry = 15 * 60 * 1000, // Increased to 15 minutes
    staleWhileRevalidate = true,
    backgroundRefresh = true,
    retryOnError = true
  } = options;
  
  // Update fetch function ref
  useEffect(() => {
    fetchFunctionRef.current = fetchFunction;
  }, [fetchFunction]);
  
  // Start background refresh processor
  useEffect(() => {
    if (backgroundRefresh) {
      startBackgroundRefresh();
    }
  }, [backgroundRefresh]);
  
  const fetchData = useCallback(async (forceRefresh = false, isBackgroundRefresh = false) => {
    try {
      const now = Date.now();
      
      // Deduplication: Check if same request is already ongoing
      if (!forceRefresh && ongoingRequests.has(cacheKey)) {
        const result = await ongoingRequests.get(cacheKey)!;
        if (isMountedRef.current && !isBackgroundRefresh) {
          setData(result);
          setIsLoading(false);
          setError(null);
        }
        return result;
      }
      
      // Check cache first
      const cachedItem = cache.get(cacheKey);
      const isExpired = cachedItem && now > cachedItem.timestamp + cachedItem.expiry;
      const isStale = cachedItem && now > cachedItem.timestamp + (cachedItem.expiry * 0.8); // 80% of expiry
      
      // Serve from cache if not expired
      if (!forceRefresh && cachedItem && !isExpired) {
        if (isMountedRef.current && !isBackgroundRefresh) {
          setData(cachedItem.data);
          setIsLoading(false);
          setError(null);
        }
        
        // Schedule background refresh if stale
        if (isStale && backgroundRefresh && !backgroundRefreshQueue.has(cacheKey)) {
          backgroundRefreshQueue.add(cacheKey);
          // Trigger immediate background refresh for this instance
          setTimeout(() => fetchData(true, true), 0);
        }
        
        return cachedItem.data;
      }
      
      // If stale-while-revalidate, serve stale data immediately
      if (staleWhileRevalidate && cachedItem && !isBackgroundRefresh) {
        if (isMountedRef.current) {
          setData(cachedItem.data);
          setIsLoading(false);
        }
      } else if (!isBackgroundRefresh) {
        if (isMountedRef.current) {
          setIsLoading(true);
        }
      }
      
      // Create and track the request
      const requestPromise = fetchFunctionRef.current();
      ongoingRequests.set(cacheKey, requestPromise);
      requestTimestamps.set(cacheKey, now);
      
      // Fetch fresh data
      const freshData = await requestPromise;
      
      // Update cache
      cache.set(cacheKey, {
        data: freshData,
        timestamp: now,
        expiry: cacheExpiry,
        isStale: false
      });
      
      // Remove from ongoing requests
      ongoingRequests.delete(cacheKey);
      
      if (isMountedRef.current && !isBackgroundRefresh) {
        setData(freshData);
        setIsLoading(false);
        setError(null);
      }
      
      return freshData;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      
      // Remove from ongoing requests
      ongoingRequests.delete(cacheKey);
      
      if (isMountedRef.current && !isBackgroundRefresh) {
        // If we have stale data and staleWhileRevalidate is enabled, keep showing it
        if (staleWhileRevalidate && cache.has(cacheKey)) {
          const cachedItem = cache.get(cacheKey)!;
          setData(cachedItem.data);
          setIsLoading(false);
          // Set error but don't clear data
          setError(error);
        } else {
          setError(error);
          setIsLoading(false);
        }
      }
      
      // Retry logic for background refreshes
      if (retryOnError && isBackgroundRefresh) {
        setTimeout(() => {
          backgroundRefreshQueue.add(cacheKey);
        }, 5000); // Retry after 5 seconds
      }
      
      throw error;
    }
  }, [cacheKey, cacheExpiry, staleWhileRevalidate, backgroundRefresh, retryOnError]);
  
  const invalidateCache = useCallback(() => {
    cache.delete(cacheKey);
    ongoingRequests.delete(cacheKey);
    backgroundRefreshQueue.delete(cacheKey);
    
    // 🚀 CRITICAL FIX: Also trigger a re-render by fetching fresh data
    // Add small delay to ensure backend cache is cleared first
    setTimeout(() => {
      if (isMountedRef.current) {
        fetchData(true); // Force refresh with fresh data
      }
    }, 100); // 100ms delay to ensure backend cache is cleared
  }, [cacheKey, fetchData]);

  const refetch = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  // 🚀 NEW: Combined invalidate and refetch for better UX
  const invalidateAndRefetch = useCallback(() => {
    cache.delete(cacheKey);
    ongoingRequests.delete(cacheKey);
    backgroundRefreshQueue.delete(cacheKey);
    
    // Force immediate re-render with loading state
    if (isMountedRef.current) {
      setIsLoading(true);
    }
    
    // Small delay to ensure backend cache is cleared, then fetch
    setTimeout(() => {
      if (isMountedRef.current) {
        fetchData(true);
      }
    }, 100);
  }, [cacheKey, fetchData]);
  
  // Mark cache as stale for background refresh
  const markStale = useCallback(() => {
    const cachedItem = cache.get(cacheKey);
    if (cachedItem) {
      cache.set(cacheKey, { ...cachedItem, isStale: true });
      if (backgroundRefresh) {
        backgroundRefreshQueue.add(cacheKey);
      }
    }
  }, [cacheKey, backgroundRefresh]);
  
  useEffect(() => {
    isMountedRef.current = true;
    fetchData();
    
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData]);
  
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  return {
    data,
    isLoading,
    error,
    refetch,
    invalidateCache,
    invalidateAndRefetch, // 🚀 NEW: Combined function for better UX
    markStale
  };
}

// Utility function to clear all cache
export const clearAllCache = () => {
  cache.clear();
  ongoingRequests.clear();
  backgroundRefreshQueue.clear();
  requestTimestamps.clear();
};

// Utility function to clear specific cache pattern
export const clearCachePattern = (pattern: string) => {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
      ongoingRequests.delete(key);
      backgroundRefreshQueue.delete(key);
      requestTimestamps.delete(key);
    }
  }
};

// Utility function to get cache stats
export const getCacheStats = () => {
  return {
    cacheSize: cache.size,
    ongoingRequests: ongoingRequests.size,
    backgroundQueue: backgroundRefreshQueue.size
  };
};

// Cleanup function
export const cleanup = () => {
  if (backgroundRefreshInterval) {
    clearInterval(backgroundRefreshInterval);
    backgroundRefreshInterval = null;
  }
  clearAllCache();
}; 