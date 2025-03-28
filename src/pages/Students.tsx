import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, Upload, Filter, PlusCircle, AlertCircle, X } from "lucide-react";
import { Student } from "@/types";
import { parseCSV, processZipFile, validateStudents } from "@/utils/fileUtils";
import { studentsApi, auditLogApi } from "@/api/apiClient";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import StudentRegistrationForm from "@/components/students/StudentRegistrationForm";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

const Students = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchField, setSearchField] = useState("all");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [importedStudents, setImportedStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [duplicates, setDuplicates] = useState<Student[]>([]);
  
  const [filters, setFilters] = useState({
    department: "",
    status: "",
    academicYear: "",
    gpaRange: "",
    gender: "",
  });
  const [isFilterActive, setIsFilterActive] = useState(false);
  
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
  
  const handleRegistrationSuccess = () => {
    fetchStudents();
    toast.success("Student registered successfully!");
    setActiveTab("list");
  };
  
  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setIsFilterActive(true);
  };
  
  const clearFilters = () => {
    setFilters({
      department: "",
      status: "",
      academicYear: "",
      gpaRange: "",
      gender: "",
    });
    setSearchQuery("");
    setSearchField("all");
    setIsFilterActive(false);
  };
  
  const getGpaRangeFilter = (gpa: number, range: string) => {
    switch (range) {
      case "3.5-4.0":
        return gpa >= 3.5 && gpa <= 4.0;
      case "3.0-3.5":
        return gpa >= 3.0 && gpa < 3.5;
      case "2.5-3.0":
        return gpa >= 2.5 && gpa < 3.0;
      case "2.0-2.5":
        return gpa >= 2.0 && gpa < 2.5;
      case "below-2.0":
        return gpa < 2.0;
      default:
        return true;
    }
  };
  
  const getUniqueValues = (field: keyof Student) => {
    return [...new Set(students.map(student => student[field]))]
      .filter(Boolean)
      .sort();
  };
  
  const filteredStudents = students.filter(student => {
    let matchesSearch = true;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      switch (searchField) {
        case "student_id":
          matchesSearch = student.student_id.toLowerCase().includes(query);
          break;
        case "full_name":
          matchesSearch = student.full_name.toLowerCase().includes(query);
          break;
        case "certificate_id":
          matchesSearch = student.certificate_id?.toLowerCase().includes(query) || false;
          break;
        case "all":
        default:
          matchesSearch = 
            student.full_name.toLowerCase().includes(query) ||
            student.student_id.toLowerCase().includes(query) ||
            (student.certificate_id?.toLowerCase().includes(query) || false) ||
            student.department.toLowerCase().includes(query);
      }
    }
    
    const matchesDepartment = !filters.department || student.department === filters.department;
    const matchesStatus = !filters.status || student.status === filters.status;
    const matchesAcademicYear = !filters.academicYear || student.academic_year === filters.academicYear;
    const matchesGpa = !filters.gpaRange || getGpaRangeFilter(student.gpa, filters.gpaRange);
    const matchesGender = !filters.gender || student.gender === filters.gender;
    
    return matchesSearch && matchesDepartment && matchesStatus && 
           matchesAcademicYear && matchesGpa && matchesGender;
  });
  
  const getActiveFilterCount = () => {
    return Object.values(filters).filter(Boolean).length + (searchQuery ? 1 : 0);
  };
  
  const activeFilterCount = getActiveFilterCount();
  
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
              <div className="flex flex-col space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none sm:min-w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search students..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={searchField} onValueChange={setSearchField}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Search in" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Fields</SelectItem>
                        <SelectItem value="student_id">Student ID</SelectItem>
                        <SelectItem value="full_name">Name</SelectItem>
                        <SelectItem value="certificate_id">Certificate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto justify-end">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="gap-2">
                          <Filter className="h-4 w-4" />
                          Filters
                          {activeFilterCount > 0 && (
                            <Badge className="ml-1" variant="secondary">{activeFilterCount}</Badge>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-4" align="end">
                        <div className="space-y-4">
                          <h4 className="font-medium">Filter Students</h4>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Department</label>
                            <Select 
                              value={filters.department} 
                              onValueChange={(value) => handleFilterChange('department', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select department" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Any Department</SelectItem>
                                {getUniqueValues('department').map((dept, index) => (
                                  <SelectItem key={index} value={dept as string}>
                                    {dept as string}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Academic Year</label>
                            <Select 
                              value={filters.academicYear} 
                              onValueChange={(value) => handleFilterChange('academicYear', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select year" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Any Year</SelectItem>
                                {getUniqueValues('academic_year').map((year, index) => (
                                  <SelectItem key={index} value={year as string}>
                                    {year as string}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Status</label>
                            <Select 
                              value={filters.status} 
                              onValueChange={(value) => handleFilterChange('status', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Any Status</SelectItem>
                                <SelectItem value="cleared">Cleared</SelectItem>
                                <SelectItem value="un-cleared">Uncleared</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium">GPA Range</label>
                            <Select 
                              value={filters.gpaRange} 
                              onValueChange={(value) => handleFilterChange('gpaRange', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select GPA range" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Any GPA</SelectItem>
                                <SelectItem value="3.5-4.0">3.5 - 4.0</SelectItem>
                                <SelectItem value="3.0-3.5">3.0 - 3.5</SelectItem>
                                <SelectItem value="2.5-3.0">2.5 - 3.0</SelectItem>
                                <SelectItem value="2.0-2.5">2.0 - 2.5</SelectItem>
                                <SelectItem value="below-2.0">Below 2.0</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Gender</label>
                            <Select 
                              value={filters.gender} 
                              onValueChange={(value) => handleFilterChange('gender', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Any Gender</SelectItem>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="flex justify-between pt-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={clearFilters}
                              className="text-xs"
                            >
                              Reset All
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => setIsFilterActive(true)}
                              className="text-xs"
                            >
                              Apply Filters
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                    
                    <Button variant="outline" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {isFilterActive && activeFilterCount > 0 && (
                  <div className="flex flex-wrap gap-2 pb-1">
                    {searchQuery && (
                      <Badge variant="secondary" className="px-2 py-1 gap-1 text-xs">
                        Search: {searchQuery.length > 10 ? searchQuery.substring(0, 10) + '...' : searchQuery}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery('')} />
                      </Badge>
                    )}
                    {filters.department && (
                      <Badge variant="secondary" className="px-2 py-1 gap-1 text-xs">
                        Department: {filters.department}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('department', '')} />
                      </Badge>
                    )}
                    {filters.academicYear && (
                      <Badge variant="secondary" className="px-2 py-1 gap-1 text-xs">
                        Year: {filters.academicYear}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('academicYear', '')} />
                      </Badge>
                    )}
                    {filters.status && (
                      <Badge variant="secondary" className="px-2 py-1 gap-1 text-xs">
                        Status: {filters.status}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('status', '')} />
                      </Badge>
                    )}
                    {filters.gpaRange && (
                      <Badge variant="secondary" className="px-2 py-1 gap-1 text-xs">
                        GPA: {filters.gpaRange}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('gpaRange', '')} />
                      </Badge>
                    )}
                    {filters.gender && (
                      <Badge variant="secondary" className="px-2 py-1 gap-1 text-xs">
                        Gender: {filters.gender}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('gender', '')} />
                      </Badge>
                    )}
                    <Button 
                      variant="ghost" 
                      className="h-6 text-xs px-2"
                      onClick={clearFilters}
                    >
                      Clear All
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">Loading students...</p>
                </div>
              ) : filteredStudents.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Academic Year</TableHead>
                      <TableHead>GPA</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id} className="hover:bg-gray-50 cursor-pointer" 
                              onClick={() => navigate(`/students/${student.id}`)}>
                        <TableCell className="font-medium">{student.student_id}</TableCell>
                        <TableCell>{student.full_name}</TableCell>
                        <TableCell>{student.department}</TableCell>
                        <TableCell>{student.academic_year}</TableCell>
                        <TableCell>{student.gpa}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            student.status === 'cleared' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {student.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/students/${student.id}`);
                                  }}>
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-6 min-h-80 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-gray-500 mb-2">No students found</p>
                    <p className="text-sm text-gray-400">Try adjusting your filters or add new students</p>
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
