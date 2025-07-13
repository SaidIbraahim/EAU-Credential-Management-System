import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Student } from "@/types";
import { studentsApi } from "@/api/apiClient";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useOptimizedData, clearCachePattern } from "@/hooks/useOptimizedData";
import StudentRegistrationForm from "@/components/students/StudentRegistrationForm";
import StudentList from "@/components/students/StudentList";
import ImportStudents from "@/components/students/ImportStudents";

const Students = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const queryParams = new URLSearchParams(location.search);
  const tabFromUrl = queryParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || "list");
  const [page, setPage] = useState(1);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Optimized students data fetching with caching
  const {
    data: studentsData,
    isLoading,
    refetch: refetchStudents,
    invalidateCache: invalidateStudentsCache
  } = useOptimizedData(
    () => studentsApi.getAll(page, 10),
    { 
      cacheKey: `students-page-${page}`,
      cacheExpiry: 3 * 60 * 1000, // 3 minutes cache
      staleWhileRevalidate: true
    }
  );

  const students = studentsData?.data || [];
  const totalPages = studentsData ? Math.ceil(studentsData.total / 10) : 1;
  
  useEffect(() => {
    if (activeTab !== "list") {
      navigate(`/students?tab=${activeTab}`, { replace: true });
    } else {
      navigate('/students', { replace: true });
    }
  }, [activeTab, navigate]);
  
  useEffect(() => {
    if (tabFromUrl && ["list", "import", "register"].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  // Refetch data when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      refetchStudents();
    }
  }, [refreshTrigger, refetchStudents]);
  
  const handleRegisterStudent = () => {
    setActiveTab("register");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  
  const handleRegistrationSuccess = useCallback(() => {
    // Clear students cache and trigger refetch
    clearCachePattern('students');
    invalidateStudentsCache();
    setPage(1);
    setRefreshTrigger(prev => prev + 1);
    toast.success("Student registered successfully!");
    setActiveTab("list");
  }, [invalidateStudentsCache]);
  
  const handleRegistrationCancel = () => {
    setActiveTab("list");
  };
  
  const handleImportSuccess = useCallback(() => {
    // Clear students cache and trigger refetch
    clearCachePattern('students');
    invalidateStudentsCache();
    setPage(1);
    setRefreshTrigger(prev => prev + 1);
    setActiveTab("list");
  }, [invalidateStudentsCache]);
  
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  return (
    <div className="space-y-4 p-4 max-w-7xl mx-auto w-full animation-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Students</h2>
        <Button 
          className="bg-primary-500 hover:bg-primary-600 text-white"
          onClick={handleRegisterStudent}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Register Student
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="list">Student List</TabsTrigger>
          <TabsTrigger value="import">Bulk Import</TabsTrigger>
          <TabsTrigger value="register">Register Student</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="animation-fade-in">
          <StudentList 
            students={students} 
            isLoading={isLoading} 
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </TabsContent>
        
        <TabsContent value="import" className="animation-fade-in">
          <ImportStudents 
            students={students} 
            onImportSuccess={handleImportSuccess} 
          />
        </TabsContent>
        
        <TabsContent value="register" className="animation-fade-in">
          <div className="bg-gray-50 min-h-screen -m-4 p-4">
            <div className="max-w-5xl mx-auto">
              <div className="bg-white rounded-lg border shadow-sm">
                <div className="border-b bg-gray-50 px-6 py-4">
                  <h3 className="text-lg font-medium text-gray-900">Register New Student</h3>
                  <p className="text-sm text-gray-600 mt-1">Fill in the student information and upload required documents</p>
                </div>
                <div className="p-6">
                  <StudentRegistrationForm 
                    onSuccess={handleRegistrationSuccess} 
                    onCancel={handleRegistrationCancel}
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Students;
