import { Skeleton } from "@/components/ui/skeleton";

interface StatsCardSkeletonProps {
  delay?: number;
  showTrend?: boolean;
}

export function StatsCardSkeleton({ delay = 0, showTrend = false }: StatsCardSkeletonProps) {
  return (
    <div 
      className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col h-full" 
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-3 w-32" />
        </div>
        <div className="p-2 bg-gray-100 rounded-lg">
          <Skeleton className="h-5 w-5" />
        </div>
      </div>
      
      {showTrend && (
        <div className="mt-auto pt-3 border-t border-gray-100">
          <Skeleton className="h-3 w-20" />
        </div>
      )}
    </div>
  );
}

export default StatsCardSkeleton; 