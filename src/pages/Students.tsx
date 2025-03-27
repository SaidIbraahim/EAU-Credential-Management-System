import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, Upload, Filter, PlusCircle, AlertCircle } from "lucide-react";
import { Student } from "@/types";
import { parseCSV, processZipFile, validateStudents } from "@/utils/fileUtils";
import { studentsApi, auditLogApi } from "@/api/apiClient";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import StudentRegistrationForm from "@/components/students/StudentRegistrationForm";

const Students = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [importedStudents, setImportedStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [duplicates, setDuplicates] = useState<Student[]>([]);
  
  const queryParams = new URLSearchParams(location.search);
  const tabFromUrl = queryParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || "list");
  
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
    fetchStudents();
  }, []);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'csv' | 'zip') => {
    if (e.target.files && e.target.files[0]) {
      if (fileType === 'csv') {
        setCsvFile(e.target.files[0]);
        setErrors([]);
        setDuplicates([]);
        setImportedStudents([]);
      } else {
        setZipFile(e.target.files[0]);
      }
    }
  };
  
  const handleImport = async () => {
    if (!csvFile) {
      toast.error("Please select a CSV file to import");
      return;
    }
    
    setIsLoading(true);
    setErrors([]);
    setDuplicates([]);
    
    try {
      const parsedStudents = await parseCSV(csvFile);
      
      const { validStudents, duplicates: foundDuplicates, errors: validationErrors } = 
        validateStudents(parsedStudents, students);
      
      setDuplicates(foundDuplicates);
      
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        toast.warning(`Found ${validationErrors.length} validation issues.`);
      }
      
      setImportedStudents(parsedStudents);
      
      if (zipFile) {
        const zipResult = await processZipFile(zipFile);
        console.log(zipResult);
        toast.success("ZIP file processed successfully");
      }
      
      toast.success(`Successfully parsed ${parsedStudents.length} students from CSV`);
    } catch (error) {
      console.error("Import error:", error);
      setErrors([`Error parsing CSV: ${error instanceof Error ? error.message : "Unknown error"}`]);
      toast.error("Error importing students: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleConfirmImport = async () => {
    if (importedStudents.length === 0) {
      toast.error("No students to import");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const studentsToImport = importedStudents.filter(
        student => !duplicates.some(dup => dup.student_id === student.student_id)
      );
      
      if (studentsToImport.length === 0) {
        toast.error("All students are duplicates. No new students to import.");
        setIsLoading(false);
        return;
      }
      
      const result = await studentsApi.bulkImport(studentsToImport);
      
      await auditLogApi.logAction("Bulk Import", `Imported ${result.count} students from CSV file`);
      
      toast.success(`Successfully imported ${result.count} students`);
      
      setCsvFile(null);
      setZipFile(null);
      setImportedStudents([]);
      setErrors([]);
      setDuplicates([]);
      
      setActiveTab("list");
      
      fetchStudents();
    } catch (error) {
      console.error("Import confirmation error:", error);
      toast.error("Error confirming import: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const { data } = await studentsApi.getAll();
      setStudents(data);
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
  
  const filteredStudents = students.filter(student => 
    student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.department.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleRegistrationSuccess = () => {
    fetchStudents();
    toast.success("Student registered successfully!");
    setActiveTab("list");
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
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">Loading students...</p>
                </div>
              ) : filteredStudents.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Full Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Academic Year
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        GPA
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50 cursor-pointer" 
                          onClick={() => navigate(`/students/${student.id}`)}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student.student_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.full_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.department}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.academic_year}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.gpa}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            student.status === 'cleared' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {student.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <Button variant="ghost" size="sm" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/students/${student.id}`);
                                  }}>
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-6 min-h-80 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-gray-500 mb-2">No students found</p>
                    <p className="text-sm text-gray-400">Add students or import them from a CSV file</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="import" className="animation-fade-in">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5 space-y-1 mt-2">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Import Student Data</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Upload a CSV file containing student information. The file should include columns for Full Name, Student ID, Certificate ID, Gender, Phone Number, Department, Academic Year, GPA, Grade, Admission Date, Graduation Date, and Status.
                </p>
                
                <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="mx-auto h-10 w-10 text-gray-400 mb-4" />
                  <p className="text-sm text-gray-500 mb-2">
                    Drag and drop your CSV file here, or click to browse
                  </p>
                  <label className="inline-block">
                    <span className="bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-primary-600 transition-colors">
                      Browse Files
                    </span>
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, 'csv')}
                    />
                  </label>
                  {csvFile && (
                    <p className="mt-2 text-sm text-gray-600">
                      Selected: {csvFile.name}
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Import Student Documents</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Upload a ZIP file containing photos, transcripts, certificates, and supporting documents for students. The ZIP structure should match the student IDs in the CSV file.
                </p>
                
                <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="mx-auto h-10 w-10 text-gray-400 mb-4" />
                  <p className="text-sm text-gray-500 mb-2">
                    Drag and drop your ZIP file here, or click to browse
                  </p>
                  <label className="inline-block">
                    <span className="bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-primary-600 transition-colors">
                      Browse Files
                    </span>
                    <input
                      type="file"
                      accept=".zip"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, 'zip')}
                    />
                  </label>
                  {zipFile && (
                    <p className="mt-2 text-sm text-gray-600">
                      Selected: {zipFile.name}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  className="bg-primary-500 hover:bg-primary-600 text-white"
                  disabled={!csvFile || isLoading}
                  onClick={handleImport}
                >
                  {isLoading ? 'Processing...' : 'Import Data'}
                </Button>
              </div>
              
              {duplicates.length > 0 && (
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertTitle className="text-yellow-800">Warning: Duplicate Students</AlertTitle>
                  <AlertDescription className="text-yellow-700">
                    <p className="mb-2">The following students already exist in the system:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      {duplicates.map((student, index) => (
                        <li key={index}>{student.full_name} (ID: {student.student_id})</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              
              {importedStudents.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-4">Preview Imported Data</h3>
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Certificate ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Full Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Gender
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Department
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Academic Year
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            GPA
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {importedStudents.map((student) => (
                          <tr key={student.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {student.student_id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {student.certificate_id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {student.full_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {student.gender}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {student.department}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {student.academic_year}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {student.gpa}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                student.status === 'cleared' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {student.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <Button 
                      variant="outline" 
                      className="mr-2"
                      onClick={() => {
                        setCsvFile(null);
                        setZipFile(null);
                        setImportedStudents([]);
                        setErrors([]);
                        setDuplicates([]);
                      }}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button 
                      className="bg-primary-500 hover:bg-primary-600 text-white"
                      onClick={handleConfirmImport}
                      disabled={isLoading || errors.length > 0}
                    >
                      {isLoading ? 'Processing...' : 'Confirm Import'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="register" className="animation-fade-in">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-medium mb-4">Register New Student</h3>
            <StudentRegistrationForm onSuccess={handleRegistrationSuccess} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Students;
