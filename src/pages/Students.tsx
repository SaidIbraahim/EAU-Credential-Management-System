
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Student } from "@/types";
import { studentsApi } from "@/api/apiClient";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import StudentRegistrationForm from "@/components/students/StudentRegistrationForm";
import StudentList from "@/components/students/StudentList";
import ImportStudents from "@/components/students/ImportStudents";

const Students = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  
  const queryParams = new URLSearchParams(location.search);
  const tabFromUrl = queryParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || "list");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
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
  
  useEffect(() => {
    fetchStudents(page);
  }, [page]);
  
  const fetchStudents = async (currentPage = 1) => {
    setIsLoading(true);
    try {
      const { data, total } = await studentsApi.getAll(currentPage, 10);
      setStudents(data);
      setTotalPages(Math.ceil(total / 10));
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Error loading students");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRegisterStudent = () => {
    setActiveTab("register");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  
  const handleRegistrationSuccess = () => {
    fetchStudents(1);
    setPage(1);
    toast.success("Student registered successfully!");
    setActiveTab("list");
  };
  
  const handleRegistrationCancel = () => {
    setActiveTab("list");
  };
  
  const handleImportSuccess = () => {
    fetchStudents(1);
    setPage(1);
    setActiveTab("list");
  };
  
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto w-full animation-fade-in">
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
      
      <Tabs defaultValue="list" className="w-full" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
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
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-medium mb-4">Register New Student</h3>
            <StudentRegistrationForm 
              onSuccess={handleRegistrationSuccess} 
              onCancel={handleRegistrationCancel}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Students;
