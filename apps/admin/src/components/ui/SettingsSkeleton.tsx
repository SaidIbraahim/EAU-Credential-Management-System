import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Lock, Shield, Users } from "lucide-react";

interface SettingsSkeletonProps {
  showAdminTab?: boolean;
  activeTab?: 'profile' | 'security' | 'admin-management';
}

const SettingsSkeleton = ({ 
  showAdminTab = false, 
  activeTab = 'profile' 
}: SettingsSkeletonProps) => {
  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <Skeleton className="h-8 w-32" />
      
      <Tabs defaultValue={activeTab} className="w-full">
        {/* Tabs List */}
        <TabsList className={`grid w-full ${showAdminTab ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Security
          </TabsTrigger>
          {showAdminTab && (
            <TabsTrigger value="admin-management" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Admin Management
            </TabsTrigger>
          )}
        </TabsList>
        
        {/* Profile Tab Content */}
        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>
                <Skeleton className="h-6 w-40" />
              </CardTitle>
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Avatar Section */}
                <div className="flex flex-col items-center sm:items-start space-y-4">
                  <Skeleton className="w-24 h-24 rounded-full" />
                </div>
                
                {/* Profile Fields */}
                <div className="flex-1 space-y-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Security Tab Content */}
        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>
                <Skeleton className="h-6 w-32" />
              </CardTitle>
              <Skeleton className="h-4 w-80" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </CardContent>
            <div className="p-6 pt-0">
              <div className="flex justify-end">
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Admin Management Tab Content */}
        {showAdminTab && (
          <TabsContent value="admin-management" className="mt-6">
            <div className="space-y-6">
              {/* Header Section */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        <Skeleton className="h-6 w-40" />
                      </CardTitle>
                      <Skeleton className="h-4 w-80 mt-2" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-9 w-20" />
                      <Skeleton className="h-9 w-28" />
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Admin Accounts Table */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    <Skeleton className="h-6 w-32" />
                  </CardTitle>
                  <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Table Header */}
                    <div className="grid grid-cols-6 gap-4 pb-2 border-b">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    
                    {/* Table Rows */}
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="grid grid-cols-6 gap-4 py-3 border-b last:border-b-0">
                        {/* Admin Column */}
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div>
                            <Skeleton className="h-4 w-32 mb-1" />
                            <Skeleton className="h-3 w-8" />
                          </div>
                        </div>
                        
                        {/* Role Column */}
                        <Skeleton className="h-5 w-16 rounded-full" />
                        
                        {/* Status Column */}
                        <Skeleton className="h-5 w-14 rounded-full" />
                        
                        {/* Last Login Column */}
                        <Skeleton className="h-4 w-24" />
                        
                        {/* Created Column */}
                        <Skeleton className="h-4 w-20" />
                        
                        {/* Actions Column */}
                        <Skeleton className="h-8 w-8 rounded" />
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <Skeleton className="h-4 w-32" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default SettingsSkeleton; 