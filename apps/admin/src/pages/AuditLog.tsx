import React, { useState, useMemo } from 'react';
import { 
  Shield, Search, RefreshCw, Download, Clock, 
  User, LogIn, LogOut, FileText, Edit, Trash2,
  AlertCircle, CheckCircle, Activity, Eye, Filter,
  Calendar, Users, TrendingUp, Database
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
    { value: 'auth', label: 'Authentication', icon: LogIn },
    { value: 'student', label: 'Student Management', icon: User },
    { value: 'document', label: 'Document Operations', icon: FileText },
    { value: 'system', label: 'System Administration', icon: Shield }
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

  // Get activity icon with modern styling
  const getActivityIcon = (action: string, resourceType?: string) => {
    const actionLower = action.toLowerCase();
    const iconClass = "h-4 w-4";
    
    if (actionLower.includes('login')) return <LogIn className={iconClass} />;
    if (actionLower.includes('logout')) return <LogOut className={iconClass} />;
    if (actionLower.includes('delete')) return <Trash2 className={iconClass} />;
    if (actionLower.includes('update') || actionLower.includes('edit')) return <Edit className={iconClass} />;
    if (actionLower.includes('view') || actionLower.includes('download')) return <Eye className={iconClass} />;
    if (resourceType?.toLowerCase() === 'document') return <FileText className={iconClass} />;
    if (resourceType?.toLowerCase() === 'student') return <User className={iconClass} />;
    
    return <Activity className={iconClass} />;
  };

  // Get activity badge color
  const getActivityBadgeColor = (action: string, resourceType?: string) => {
    const actionLower = action.toLowerCase();
    
    if (actionLower.includes('login') || actionLower.includes('auth')) return 'bg-green-100 text-green-800 border-green-200';
    if (actionLower.includes('logout')) return 'bg-gray-100 text-gray-800 border-gray-200';
    if (actionLower.includes('delete')) return 'bg-red-100 text-red-800 border-red-200';
    if (actionLower.includes('update') || actionLower.includes('edit')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (resourceType?.toLowerCase() === 'document') return 'bg-purple-100 text-purple-800 border-purple-200';
    if (resourceType?.toLowerCase() === 'student') return 'bg-orange-100 text-orange-800 border-orange-200';
    
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Format action name
  const formatActionName = (action: string) => {
    return action.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
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
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <AlertCircle className="h-6 w-6" />
                <span className="font-semibold text-lg">Unable to Load Audit Logs</span>
              </div>
              <p className="text-red-700 mb-6">{error?.message || 'Failed to load audit logs'}</p>
              <Button onClick={refresh} className="bg-red-600 hover:bg-red-700">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Shield className="h-8 w-8 text-blue-600" />
                System Audit Log
              </h1>
              <p className="text-gray-600 mt-2">Monitor and track all system activities and user interactions</p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={refresh} 
                disabled={isLoading}
                className="h-10"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                onClick={() => exportCsv()} 
                disabled={isExporting}
                className="h-10 bg-blue-600 hover:bg-blue-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Today's Activities</p>
                    <p className="text-2xl font-bold text-blue-900">{stats.totals?.today || 0}</p>
                  </div>
                  <div className="p-3 bg-blue-600 rounded-xl">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">This Week</p>
                    <p className="text-2xl font-bold text-green-900">{stats.totals?.thisWeek || 0}</p>
                  </div>
                  <div className="p-3 bg-green-600 rounded-xl">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700">Active Users</p>
                    <p className="text-2xl font-bold text-purple-900">{stats.topUsers?.length || 0}</p>
                  </div>
                  <div className="p-3 bg-purple-600 rounded-xl">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700">Total Records</p>
                    <p className="text-2xl font-bold text-orange-900">{stats.totals?.total || 0}</p>
                  </div>
                  <div className="p-3 bg-orange-600 rounded-xl">
                    <Database className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search activities, users, or details..."
                  className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleSearch}
                />
              </div>
              
              <Select value={activityFilter} onValueChange={setActivityFilter}>
                <SelectTrigger className="w-full lg:w-64 h-11 bg-gray-50 border-gray-200">
                  <Filter className="h-4 w-4 mr-2 text-gray-500" />
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
                <Button variant="outline" onClick={clearSearch} className="h-11 px-6">
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activity Log */}
        <Card className="bg-white shadow-sm">
          <CardHeader className="border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Activity Timeline
              </CardTitle>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {filteredActivities.length} activities
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mr-3" />
                <span className="text-gray-600">Loading activities...</span>
              </div>
            ) : filteredActivities.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {filteredActivities.slice(0, limit).map((log) => (
                  <div key={log.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                      {/* Activity Icon */}
                      <div className="flex-shrink-0 mt-1">
                        <div className={`p-3 rounded-xl ${getActivityBadgeColor(log.action, log.resourceType)}`}>
                          {getActivityIcon(log.action, log.resourceType)}
                        </div>
                      </div>

                      {/* Activity Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            {formatActionName(log.action)}
                          </h3>
                          <time className="text-sm text-gray-500 font-mono">
                            {formatTimestamp(log.timestamp)}
                          </time>
                        </div>
                        
                        <p className="text-gray-600 mb-3">
                          {log.details || 'No additional details provided'}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-900">
                              {log.user?.email || 'System'}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {log.user?.role || 'System'}
                            </Badge>
                          </div>
                          {log.ipAddress && (
                            <div className="flex items-center gap-2 text-gray-500">
                              <span className="font-mono">{log.ipAddress}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <Shield className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
                <p className="text-gray-500 text-center max-w-md">
                  {searchTerm || activityFilter !== 'all'
                    ? 'No activities match your current search criteria. Try adjusting your filters.'
                    : 'No activities have been recorded yet. Activities will appear here as users interact with the system.'}
                </p>
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Show</span>
                  <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
                    <SelectTrigger className="w-20 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-gray-700">per page</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(currentPage - 1)}
                    disabled={!pagination.hasPrev}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-700 px-3">
                    Page {currentPage} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(currentPage + 1)}
                    disabled={!pagination.hasNext}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuditLogPage;
