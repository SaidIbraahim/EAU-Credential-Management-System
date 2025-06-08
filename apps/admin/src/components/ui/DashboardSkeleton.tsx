import { Skeleton } from "@/components/ui/skeleton";
import { StatsCardSkeleton } from "./StatsCardSkeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto w-full">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
      
      {/* Stats Grid 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCardSkeleton delay={100} showTrend />
        <StatsCardSkeleton delay={200} />
        <StatsCardSkeleton delay={300} />
        <StatsCardSkeleton delay={400} />
      </div>
      
      {/* Stats Grid 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCardSkeleton delay={500} showTrend />
        <StatsCardSkeleton delay={600} showTrend />
        <StatsCardSkeleton delay={700} />
        <StatsCardSkeleton delay={800} />
      </div>
      
      {/* System Overview Skeleton */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <Skeleton className="h-5 w-32 mb-3" />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-3 w-8" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-8" />
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <Skeleton className="h-5 w-36 mb-3" />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-6" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-8" />
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <Skeleton className="h-5 w-28 mb-3" />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-18" />
                  <Skeleton className="h-3 w-6" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-14" />
                  <Skeleton className="h-3 w-8" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardSkeleton; 