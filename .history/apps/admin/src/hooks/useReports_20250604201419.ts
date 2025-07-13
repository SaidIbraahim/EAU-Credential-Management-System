import { useState, useEffect, useCallback } from 'react';
import { dashboardApi, ReportsData } from '@/api/apiClient';
import { toast } from 'sonner';

interface UseReportsResult {
  reportsData: ReportsData | null;
  isLoading: boolean;
  error: string | null;
  refreshReports: () => Promise<void>;
  lastUpdated: Date | null;
}

export const useReports = (autoRefresh: boolean = false, refreshInterval: number = 60000): UseReportsResult => {
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      const data = await dashboardApi.getReports();
      setReportsData(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch reports data';
      setError(errorMessage);
      if (!reportsData) {
        // Only show toast if we don't have any data yet
        toast.error(errorMessage);
      }
      throw err;
    }
  }, [reportsData]);

  const refreshReports = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await fetchReports();
    } catch (err: any) {
      console.error('Failed to refresh reports data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchReports]);

  // Initial load
  useEffect(() => {
    refreshReports();
  }, []);

  // Auto-refresh functionality (optional, reports data changes less frequently)
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Only auto-refresh if we're not currently loading and have data
      if (!isLoading && reportsData) {
        fetchReports().catch(() => {
          // Silent refresh - don't show errors for background updates
        });
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, isLoading, reportsData, fetchReports]);

  return {
    reportsData,
    isLoading,
    error,
    refreshReports,
    lastUpdated
  };
}; 