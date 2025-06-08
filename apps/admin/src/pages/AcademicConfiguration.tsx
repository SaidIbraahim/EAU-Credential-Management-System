import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Building, BookOpen } from "lucide-react";
import DepartmentManager from "@/components/academic/DepartmentManager";
import AcademicYearManager from "@/components/academic/AcademicYearManager";
import FacultyManager from "@/components/academic/FacultyManager";
import AcademicConfigSkeleton from "@/components/ui/AcademicConfigSkeleton";
import { useOptimizedData } from "@/hooks/useOptimizedData";
import { facultiesApi, departmentsApi, academicYearsApi } from "@/api/apiClient";

const AcademicConfiguration = () => {
  const [activeTab, setActiveTab] = useState("departments");

  // Preload all academic data at the parent level
  const {
    data: faculties,
    isLoading: facultiesLoading
  } = useOptimizedData(
    () => facultiesApi.getAll(),
    { 
      cacheKey: 'faculties',
      cacheExpiry: 10 * 60 * 1000, // 10 minutes cache
      staleWhileRevalidate: true
    }
  );

  const {
    data: departments,
    isLoading: departmentsLoading
  } = useOptimizedData(
    () => departmentsApi.getAll(),
    { 
      cacheKey: 'departments',
      cacheExpiry: 5 * 60 * 1000, // 5 minutes cache
      staleWhileRevalidate: true
    }
  );

  const {
    data: academicYears,
    isLoading: academicYearsLoading
  } = useOptimizedData(
    () => academicYearsApi.getAll(),
    { 
      cacheKey: 'academic-years',
      cacheExpiry: 5 * 60 * 1000, // 5 minutes cache
      staleWhileRevalidate: true
    }
  );

  const isLoading = facultiesLoading || departmentsLoading || academicYearsLoading;

  if (isLoading) {
    return (
      <AcademicConfigSkeleton 
        activeTab={activeTab as "departments" | "faculties" | "academic-years"} 
        showSearch={activeTab === "departments"}
        rowCount={6}
      />
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Academic Configuration</h1>
        <p className="text-muted-foreground">
          Manage departments, faculties, and academic years for student registration
        </p>
      </div>

      <Tabs
        defaultValue="departments"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full md:w-[600px] grid-cols-3">
          <TabsTrigger value="departments" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span>Departments</span>
          </TabsTrigger>
          <TabsTrigger value="faculties" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>Faculties</span>
          </TabsTrigger>
          <TabsTrigger value="academic-years" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Academic Years</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="departments" className="mt-6">
          <DepartmentManager 
            preloadedDepartments={departments}
            preloadedFaculties={faculties}
          />
        </TabsContent>
        <TabsContent value="faculties" className="mt-6">
          <FacultyManager preloadedFaculties={faculties} />
        </TabsContent>
        <TabsContent value="academic-years" className="mt-6">
          <AcademicYearManager preloadedAcademicYears={academicYears} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AcademicConfiguration;
