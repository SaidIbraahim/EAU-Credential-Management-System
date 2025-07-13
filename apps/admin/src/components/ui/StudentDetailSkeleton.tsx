import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, User, GraduationCap, FileText } from "lucide-react";

interface StudentDetailSkeletonProps {
  isNewStudent?: boolean;
}

const StudentDetailSkeleton = ({ isNewStudent = false }: StudentDetailSkeletonProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact Header Skeleton */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <ArrowLeft className="h-4 w-4 text-gray-400" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="h-5 w-px bg-gray-300" />
              <div>
                <Skeleton className="h-5 w-48 mb-1" />
                {!isNewStudent && (
                  <div className="flex items-center gap-3 mt-0.5">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-4 w-16 rounded-full" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {!isNewStudent && (
                <>
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-20" />
                </>
              )}
              {isNewStudent && (
                <>
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-20" />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="space-y-4">
          
          {/* Personal Information Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="space-y-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Academic Information Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-green-600" />
                Academic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="space-y-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Documents Section - Only for existing students */}
          {!isNewStudent && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-600" />
                  Documents & Files
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Document Summary Cards */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="text-center p-4 rounded-lg border bg-gray-50">
                      <Skeleton className="h-8 w-8 mx-auto mb-2" />
                      <Skeleton className="h-4 w-12 mx-auto mb-1" />
                      <Skeleton className="h-3 w-16 mx-auto" />
                    </div>
                  ))}
                </div>

                {/* Document List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </div>
                  
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded" />
                        <div>
                          <Skeleton className="h-4 w-32 mb-1" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDetailSkeleton; 