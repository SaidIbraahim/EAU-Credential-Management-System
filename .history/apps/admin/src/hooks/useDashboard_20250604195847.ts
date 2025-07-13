import { useState, useEffect, useCallback } from 'react';
import { dashboardApi, QuickStats, DashboardStats } from '@/api/apiClient';
import { toast } from 'sonner';

interface UseDashboardResult {
  quickStats: QuickStats | null;
  fullStats: DashboardStats | null;
  isLoading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
  lastUpdated: Date | null;
}

export const useDashboard = (autoRefresh: boolean = true, refreshInterval: number = 30000): UseDashboardResult => {
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [fullStats, setFullStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchQuickStats = useCallback(async () => {
    try {
      const data = await dashboardApi.getQuickStats();
      setQuickStats(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch quick stats';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const fetchFullStats = useCallback(async () => {
    try {
      const data = await dashboardApi.getStats();
      setFullStats(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch full stats';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const refreshStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await Promise.all([fetchQuickStats(), fetchFullStats()]);
    } catch (err: any) {
      console.error('Failed to refresh dashboard statistics:', err);
      if (!quickStats) {
        // Only show toast if we don't have any data yet
        toast.error('Failed to load dashboard statistics');
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchQuickStats, fetchFullStats, quickStats]);

  // Initial load
  useEffect(() => {
    refreshStats();
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Only auto-refresh if we're not currently loading and have data
      if (!isLoading && quickStats) {
        fetchQuickStats().catch(() => {
          // Silent refresh - don't show errors for background updates
        });
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, isLoading, quickStats, fetchQuickStats]);

  return {
    quickStats,
    fullStats,
    isLoading,
    error,
    refreshStats,
    lastUpdated
  };
}; 