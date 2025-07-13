import { Skeleton } from "@/components/ui/skeleton";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings, 
  BookOpen,
  ClipboardList
} from "lucide-react";

const AppSkeleton = () => {
  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar Skeleton */}
      <div className="fixed left-0 top-0 z-40 h-screen w-16 lg:w-64 bg-white border-r border-gray-200 shadow-sm">
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="flex items-center justify-center lg:justify-start gap-3 p-4 border-b border-gray-200">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="hidden lg:block">
              <Skeleton className="h-6 w-24 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          
          {/* Navigation Items */}
          <div className="flex-1 px-3 py-4 space-y-2">
            {[
              { icon: LayoutDashboard, label: "Dashboard" },
              { icon: Users, label: "Students" },
              { icon: BookOpen, label: "Academic Config" },
              { icon: FileText, label: "Reports" },
              { icon: ClipboardList, label: "Audit Log" },
              { icon: Settings, label: "Settings" }
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3 px-3 py-2 rounded-lg">
                <item.icon className="h-5 w-5 text-gray-400" />
                <div className="hidden lg:block flex-1">
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))}
          </div>
          
          {/* User Section */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="hidden lg:block flex-1">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col pl-16 lg:pl-64">
        {/* Header Skeleton */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto w-full space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-center">
              <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-32" />
              </div>
            </div>

            {/* Content Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
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
                </div>
              ))}
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="space-y-4">
                {/* Content Header */}
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-36" />
                  <Skeleton className="h-4 w-48" />
                </div>
                
                {/* Content Body */}
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
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
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppSkeleton; 