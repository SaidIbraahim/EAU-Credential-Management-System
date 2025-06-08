import React, { useState, useMemo } from 'react';
import { 
  Shield, Search, RefreshCw, Download, Clock, 
  User, LogIn, LogOut, FileText, Edit, Trash2,
  AlertCircle, CheckCircle, Activity, Eye, Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import AuditLogSkeleton from '@/components/ui/AuditLogSkeleton';

const AuditLogPage: React.FC = () => {
  const {
    auditLogs,
    stats,
    pagination,
    isLoading,
    isExporting,
    error,
    currentPage,
    limit,
    filters,
    setPage,
    setLimit,
    setFilters,
    clearFilters,
    refresh,
    exportCsv,
    getActionColor,
    formatTimestamp
  } = useAuditLogs();

  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [activityFilter, setActivityFilter] = useState('all');

  // Essential activity types for minimalist view
  const activityTypes = [
    { value: 'all', label: 'All Activities', icon: Activity },
    { value: 'auth', label: 'Login/Auth', icon: LogIn },
    { value: 'student', label: 'Student Ops', icon: User },
    { value: 'document', label: 'Documents', icon: FileText },
    { value: 'system', label: 'System Admin', icon: Shield }
  ];

  // Filter activities with simplified logic
  const filteredActivities = useMemo(() => {
    let filtered = auditLogs;
    
    // Apply activity type filter
    if (activityFilter !== 'all') {
      filtered = filtered.filter(log => {
        const action = log.action.toLowerCase();
        const resource = log.resourceType?.toLowerCase() || '';
        
        switch (activityFilter) {
          case 'auth':
            return action.includes('login') || action.includes('logout') || action.includes('auth');
          case 'student':
            return resource === 'student' || action.includes('student');
          case 'document':
            return resource === 'document' || action.includes('document') || action.includes('upload');
          case 'system':
            return action.includes('delete') || action.includes('export') || action.includes('update');
          default:
            return true;
        }
      });
    }

    // Apply search filter
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.user?.email?.toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query) ||
        log.details?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [auditLogs, activityFilter, searchTerm]);

  // Get activity icon
  const getActivityIcon = (action: string, resourceType?: string) => {
    const actionLower = action.toLowerCase();
    
    if (actionLower.includes('login')) return <LogIn className="h-3 w-3" />;
    if (actionLower.includes('logout')) return <LogOut className="h-3 w-3" />;
    if (actionLower.includes('delete')) return <Trash2 className="h-3 w-3" />;
    if (actionLower.includes('update') || actionLower.includes('edit')) return <Edit className="h-3 w-3" />;
    if (actionLower.includes('view') || actionLower.includes('download')) return <Eye className="h-3 w-3" />;
    if (resourceType?.toLowerCase() === 'document') return <FileText className="h-3 w-3" />;
    if (resourceType?.toLowerCase() === 'student') return <User className="h-3 w-3" />;
    
    return <Activity className="h-3 w-3" />;
  };

  // Get simplified activity type
  const getActivityType = (action: string, resourceType?: string) => {
    const actionLower = action.toLowerCase();
    
    if (actionLower.includes('login') || actionLower.includes('auth')) return 'Authentication';
    if (actionLower.includes('student') || resourceType?.toLowerCase() === 'student') return 'Student';
    if (actionLower.includes('document') || resourceType?.toLowerCase() === 'document') return 'Document';
    if (actionLower.includes('delete') || actionLower.includes('export')) return 'System';
    
    return 'General';
  };

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setFilters({ search: searchTerm || undefined });
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setActivityFilter('all');
    clearFilters();
  };

  if (isLoading && !auditLogs.length) {
    return <AuditLogSkeleton showMetrics={true} activityCount={8} />;
  }

  if (error) {
    return (
      <div className="w-full px-4 py-4">
        <Card className="border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-600 mb-2">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Error Loading Audit Logs</span>
            </div>
            <p className="text-gray-600 mb-4">{error?.message || 'Failed to load audit logs'}</p>
            <Button onClick={refresh} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-4 space-y-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Audit</h1>
          <p className="text-sm text-gray-600">Monitor login activities and system operations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={refresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportCsv()} disabled={isExporting}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Essential Metrics - Compact Row */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Today</p>
                <p className="text-lg font-semibold">{stats.totals?.today || 0}</p>
              </div>
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Login Events</p>
                <p className="text-lg font-semibold">
                  {auditLogs.filter(log => log.action.toLowerCase().includes('login')).length}
                </p>
              </div>
              <LogIn className="h-4 w-4 text-green-500" />
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">This Week</p>
                <p className="text-lg font-semibold">{stats.totals?.thisWeek || 0}</p>
              </div>
              <Activity className="h-4 w-4 text-purple-500" />
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Active Users</p>
                <p className="text-lg font-semibold">{stats.topUsers?.length || 0}</p>
              </div>
              <User className="h-4 w-4 text-orange-500" />
            </div>
          </Card>
        </div>
      )}

      {/* Compact Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search activities..."
                className="pl-9 h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleSearch}
              />
            </div>
            
            <Select value={activityFilter} onValueChange={setActivityFilter}>
              <SelectTrigger className="w-full sm:w-40 h-9">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {activityTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="h-4 w-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(searchTerm || activityFilter !== 'all') && (
              <Button variant="outline" size="sm" onClick={clearSearch} className="w-full sm:w-auto">
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Compact Activity List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Recent Activities
            <Badge variant="secondary" className="ml-auto">
              {filteredActivities.length} records
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-200 animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="w-32 h-3 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="text-right space-y-1">
                    <div className="w-16 h-3 bg-gray-200 rounded animate-pulse" />
                    <div className="w-12 h-3 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredActivities.length > 0 ? (
            <div className="overflow-x-auto">
              <div className="min-w-full">
                {filteredActivities.slice(0, limit).map((log, index) => (
                  <div 
                    key={log.id} 
                    className={`flex items-center gap-3 p-3 border-b last:border-b-0 hover:bg-gray-50 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    } min-w-0`}
                  >
                    {/* Activity Icon & Type */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`p-1.5 rounded-lg ${getActionColor(log.action)} bg-opacity-10 flex-shrink-0`}>
                        {getActivityIcon(log.action, log.resourceType)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            {getActivityType(log.action, log.resourceType)}
                          </Badge>
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {log.action}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 truncate" title={log.details}>
                          {log.details || 'No details available'}
                        </p>
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="hidden lg:flex items-center gap-2 min-w-0 w-48 flex-shrink-0">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <User className="h-3 w-3 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-900 truncate">
                          {log.user?.email || 'System'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {log.user?.role || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Time & Status */}
                    <div className="text-right min-w-0 w-28 flex-shrink-0">
                      <p className="text-xs font-medium text-gray-900">
                        {formatTimestamp(log.timestamp)}
                      </p>
                      <p className="text-xs text-gray-500 font-mono">
                        {log.ipAddress || 'Unknown'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Shield className="h-8 w-8 text-gray-400 mb-3" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">No activities found</h3>
              <p className="text-xs text-gray-500 text-center">
                {searchTerm || activityFilter !== 'all'
                  ? 'Try adjusting your search or filter'
                  : 'No activities have been recorded yet'}
              </p>
            </div>
          )}

          {/* Compact Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t bg-gray-50">
              <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(currentPage - 1)}
                  disabled={!pagination.hasPrev}
                >
                  ←
                </Button>
                <span className="text-xs px-2 py-1 bg-white border rounded">
                  {currentPage} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(currentPage + 1)}
                  disabled={!pagination.hasNext}
                >
                  →
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compact Activity Summary */}
      {stats?.topActions?.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Common Activities</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {stats.topActions.slice(0, 3).map((action: any, index: number) => (
                  <div key={action.action} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-gray-900">{action.action}</span>
                    </div>
                    <span className="font-medium text-gray-600">{action.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Active Users</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {stats.topUsers?.slice(0, 3).map((userStat: any, index: number) => (
                  <div key={userStat.user?.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-green-100 text-green-600 text-xs flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-gray-900 truncate">
                        {userStat.user?.email || 'Unknown'}
                      </span>
                    </div>
                    <span className="font-medium text-gray-600">{userStat.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AuditLogPage;
