import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Building, BookOpen, Loader2 } from "lucide-react";
import DepartmentManager from "@/components/academic/DepartmentManager";
import AcademicYearManager from "@/components/academic/AcademicYearManager";
import FacultyManager from "@/components/academic/FacultyManager";
import { useOptimizedData } from "@/hooks/useOptimizedData";
import { facultiesApi, departmentsApi, academicYearsApi } from "@/api/apiClient";
import { 
  CACHE_KEYS, 
  ACADEMIC_CACHE_CONFIG 
} from "@/lib/cacheConfig";

const AcademicConfiguration = () => {
  const [activeTab, setActiveTab] = useState("departments");

  // Preload all academic data at the parent level with standardized cache keys
  const {
    data: faculties,
    isLoading: facultiesLoading
  } = useOptimizedData(
    () => facultiesApi.getAll(),
    { 
      cacheKey: CACHE_KEYS.FACULTIES,
      ...ACADEMIC_CACHE_CONFIG
    }
  );

  const {
    data: departments,
    isLoading: departmentsLoading
  } = useOptimizedData(
    () => departmentsApi.getAll(),
    { 
      cacheKey: CACHE_KEYS.DEPARTMENTS,
      ...ACADEMIC_CACHE_CONFIG
    }
  );

  const {
    data: academicYears,
    isLoading: academicYearsLoading
  } = useOptimizedData(
    () => academicYearsApi.getAll(),
    { 
      cacheKey: CACHE_KEYS.ACADEMIC_YEARS,
      ...ACADEMIC_CACHE_CONFIG
    }
  );

  const isLoading = facultiesLoading || departmentsLoading || academicYearsLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Academic Configuration</h1>
          <p className="text-muted-foreground">
            Manage departments, faculties, and academic years for student registration
          </p>
        </div>
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin mr-3" />
          <span className="text-lg">Loading academic configuration...</span>
        </div>
      </div>
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
