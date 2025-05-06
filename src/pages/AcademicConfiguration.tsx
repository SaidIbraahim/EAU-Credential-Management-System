
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Building, BookOpen } from "lucide-react";
import DepartmentManager from "@/components/academic/DepartmentManager";
import AcademicYearManager from "@/components/academic/AcademicYearManager";
import FacultyManager from "@/components/academic/FacultyManager";

const AcademicConfiguration = () => {
  const [activeTab, setActiveTab] = useState("departments");

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
          <DepartmentManager />
        </TabsContent>
        <TabsContent value="faculties" className="mt-6">
          <FacultyManager />
        </TabsContent>
        <TabsContent value="academic-years" className="mt-6">
          <AcademicYearManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AcademicConfiguration;
