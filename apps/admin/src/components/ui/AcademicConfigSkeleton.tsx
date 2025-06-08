import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface AcademicConfigSkeletonProps {
  activeTab?: "departments" | "faculties" | "academic-years";
  showSearch?: boolean;
  rowCount?: number;
}

const AcademicConfigSkeleton = ({ 
  activeTab = "departments",
  showSearch = true,
  rowCount = 5 
}: AcademicConfigSkeletonProps) => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-col space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Tabs skeleton */}
      <div className="w-full space-y-6">
        {/* Tab triggers */}
        <div className="grid w-full md:w-[600px] grid-cols-3 gap-2 p-1 bg-muted rounded-lg">
          <div className={`flex items-center justify-center gap-2 h-10 rounded-md ${
            activeTab === "departments" ? "bg-background shadow-sm" : ""
          }`}>
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className={`flex items-center justify-center gap-2 h-10 rounded-md ${
            activeTab === "faculties" ? "bg-background shadow-sm" : ""
          }`}>
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className={`flex items-center justify-center gap-2 h-10 rounded-md ${
            activeTab === "academic-years" ? "bg-background shadow-sm" : ""
          }`}>
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>

        {/* Tab content */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-36" />
          </CardHeader>
          <CardContent>
            {/* Search skeleton */}
            {showSearch && (
              <div className="flex items-center space-x-2 mb-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-10 w-64" />
              </div>
            )}
            
            {/* Table skeleton */}
            <div className="space-y-3">
              {/* Table header */}
              <div className="grid grid-cols-5 gap-4 pb-2 border-b">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
                {activeTab === "departments" && <Skeleton className="h-4 w-16" />}
                {activeTab !== "academic-years" && <Skeleton className="h-4 w-20" />}
                {activeTab === "academic-years" && (
                  <>
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                  </>
                )}
                <Skeleton className="h-4 w-16" />
              </div>
              
              {/* Table rows */}
              {Array.from({ length: rowCount }).map((_, i) => (
                <div key={i} className="grid grid-cols-5 gap-4 py-3 border-b last:border-b-0">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                  {activeTab === "departments" && <Skeleton className="h-4 w-28" />}
                  {activeTab !== "academic-years" && <Skeleton className="h-4 w-32" />}
                  {activeTab === "academic-years" && (
                    <>
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-20" />
                    </>
                  )}
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AcademicConfigSkeleton; 