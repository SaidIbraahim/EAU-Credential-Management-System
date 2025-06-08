import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Clock, LogIn, Activity, User, Search, Filter } from "lucide-react";

interface AuditLogSkeletonProps {
  showMetrics?: boolean;
  activityCount?: number;
}

const AuditLogSkeleton = ({ 
  showMetrics = true, 
  activityCount = 8 
}: AuditLogSkeletonProps) => {
  return (
    <div className="w-full px-4 py-4 space-y-4">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      {/* Metrics Cards Skeleton */}
      {showMetrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: Clock, label: "Today" },
            { icon: LogIn, label: "Login Events" },
            { icon: Activity, label: "This Week" },
            { icon: User, label: "Active Users" }
          ].map((metric, index) => (
            <Card key={index} className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-3 w-12 mb-1" />
                  <Skeleton className="h-6 w-8" />
                </div>
                <metric.icon className="h-4 w-4 text-gray-300" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Filters Skeleton */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Skeleton className="h-9 w-full" />
            </div>
            
            <div className="w-full sm:w-40 relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Skeleton className="h-9 w-full" />
            </div>

            <Skeleton className="h-9 w-full sm:w-20" />
          </div>
        </CardContent>
      </Card>

      {/* Activity List Skeleton */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Recent Activities
            <div className="ml-auto">
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {Array.from({ length: activityCount }).map((_, index) => (
                <div 
                  key={index}
                  className={`flex items-center gap-3 p-3 border-b last:border-b-0 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  } min-w-0`}
                >
                  {/* Activity Icon & Type */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-1.5 rounded-lg bg-gray-100 flex-shrink-0">
                      <Skeleton className="h-3 w-3" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Skeleton className="h-4 w-16 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="hidden lg:flex items-center gap-2 min-w-0 w-48 flex-shrink-0">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <User className="h-3 w-3 text-gray-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Skeleton className="h-3 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>

                  {/* Time & Status */}
                  <div className="text-right min-w-0 w-28 flex-shrink-0">
                    <Skeleton className="h-3 w-20 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination Skeleton */}
          <div className="flex items-center justify-between p-4 border-t bg-gray-50">
            <Skeleton className="h-8 w-12" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards Skeleton */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              <Skeleton className="h-4 w-32" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-gray-100 text-xs flex items-center justify-center">
                      {index + 1}
                    </span>
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-4 w-8" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              <Skeleton className="h-4 w-24" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-gray-100 text-xs flex items-center justify-center">
                      {index + 1}
                    </span>
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-4 w-8" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuditLogSkeleton; 