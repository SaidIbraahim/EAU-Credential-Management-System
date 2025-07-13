import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auditLogApi } from '@/api/apiClient';
import { AuditLog } from '@/types';
import { toast } from 'sonner';

interface AuditLogFilters {
  search?: string;
  action?: string;
  resourceType?: string;
  userId?: number;
  startDate?: string;
  endDate?: string;
}

interface UseAuditLogsReturn {
  // Data
  auditLogs: AuditLog[];
  stats: any;
  pagination: any;
  
  // Loading states
  isLoading: boolean;
  isLoadingStats: boolean;
  isExporting: boolean;
  
  // Error states
  error: Error | null;
  statsError: Error | null;
  
  // Filters and pagination
  currentPage: number;
  limit: number;
  filters: AuditLogFilters;
  
  // Actions
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setFilters: (filters: AuditLogFilters) => void;
  clearFilters: () => void;
  refresh: () => void;
  refreshStats: () => void;
  exportCsv: (exportFilters?: AuditLogFilters) => Promise<void>;
  logAction: (action: string, resourceType?: string, resourceId?: number, details?: string) => Promise<void>;
  
  // Helper functions
  getActionColor: (action: string) => string;
  formatTimestamp: (timestamp: string) => string;
}

export const useAuditLogs = (): UseAuditLogsReturn => {
  const queryClient = useQueryClient();
  
  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [isExporting, setIsExporting] = useState(false);

  // Query for audit logs
  const {
    data: auditLogData,
    isLoading,
    error,
    refetch: refetchLogs
  } = useQuery({
    queryKey: ['auditLogs', currentPage, limit, filters],
    queryFn: () => auditLogApi.getAll({
      page: currentPage,
      limit,
      ...filters
    }),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Auto-refresh every 60 seconds
  });

  // Query for audit log statistics
  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['auditLogStats'],
    queryFn: () => auditLogApi.getStats(),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });

  // Mutation for logging actions
  const logActionMutation = useMutation({
    mutationFn: ({ action, resourceType, resourceId, details }: {
      action: string;
      resourceType?: string;
      resourceId?: number;
      details?: string;
    }) => auditLogApi.logAction(action, resourceType, resourceId, details),
    onSuccess: () => {
      // Invalidate and refetch audit logs and stats
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
      queryClient.invalidateQueries({ queryKey: ['auditLogStats'] });
    },
    onError: (error: any) => {
      console.error('Failed to log audit action:', error);
      // Don't show error toast for logging failures to avoid UI disruption
    }
  });

  // Actions
  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const setLimitValue = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1); // Reset to first page when changing limit
  }, []);

  const setFiltersValue = useCallback((newFilters: AuditLogFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when applying filters
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setCurrentPage(1);
  }, []);

  const refresh = useCallback(() => {
    refetchLogs();
  }, [refetchLogs]);

  const refreshStats = useCallback(() => {
    refetchStats();
  }, [refetchStats]);

  const exportCsv = useCallback(async (exportFilters?: AuditLogFilters) => {
    if (isExporting) return;
    
    setIsExporting(true);
    try {
      const blob = await auditLogApi.exportCsv(exportFilters || filters);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Audit logs exported successfully');
    } catch (error: any) {
      console.error('Export failed:', error);
      toast.error('Failed to export audit logs');
    } finally {
      setIsExporting(false);
    }
  }, [filters, isExporting]);

  const logAction = useCallback(async (
    action: string, 
    resourceType?: string, 
    resourceId?: number, 
    details?: string
  ) => {
    try {
      await logActionMutation.mutateAsync({ action, resourceType, resourceId, details });
    } catch (error) {
      // Error is already handled in mutation
    }
  }, [logActionMutation]);

  // Helper functions
  const getActionColor = useCallback((action: string): string => {
    if (action.includes('Added') || action.includes('Created') || action.includes('Import')) {
      return 'bg-green-100 text-green-800';
    }
    if (action.includes('Updated') || action.includes('Modified') || action.includes('Upload')) {
      return 'bg-blue-100 text-blue-800';
    }
    if (action.includes('Deleted') || action.includes('Removed')) {
      return 'bg-red-100 text-red-800';
    }
    if (action.includes('Login') || action.includes('Logout') || action.includes('Auth')) {
      return 'bg-purple-100 text-purple-800';
    }
    if (action.includes('Export') || action.includes('Download')) {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-gray-100 text-gray-800';
  }, []);

  const formatTimestamp = useCallback((timestamp: string): string => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }, []);

  return {
    // Data
    auditLogs: auditLogData?.auditLogs || [],
    stats,
    pagination: auditLogData?.pagination,
    
    // Loading states
    isLoading,
    isLoadingStats,
    isExporting,
    
    // Error states
    error,
    statsError,
    
    // Filters and pagination
    currentPage,
    limit,
    filters,
    
    // Actions
    setPage,
    setLimit: setLimitValue,
    setFilters: setFiltersValue,
    clearFilters,
    refresh,
    refreshStats,
    exportCsv,
    logAction,
    
    // Helper functions
    getActionColor,
    formatTimestamp
  };
}; 