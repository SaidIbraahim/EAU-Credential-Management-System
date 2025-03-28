
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Download, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Student } from "@/types";
import { auditLogApi } from "@/api/apiClient";
import { toast } from "sonner";

interface StudentListProps {
  students: Student[];
  isLoading: boolean;
}

const StudentList = ({ students, isLoading }: StudentListProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchField, setSearchField] = useState("all");
  const [filters, setFilters] = useState({
    department: "",
    status: "",
    academicYear: "",
    gpaRange: "",
    gender: "",
  });
  const [isFilterActive, setIsFilterActive] = useState(false);
  
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
  
  const getActiveFilterCount = () => {
    return Object.values(filters).filter(Boolean).length + (searchQuery ? 1 : 0);
  };
  
  const activeFilterCount = getActiveFilterCount();
  
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
  
  const getUniqueValues = (field: keyof Student) => {
    return [...new Set(students.map(student => student[field]))]
      .filter(Boolean)
      .sort();
  };
  
  const handleExportStudents = () => {
    try {
      // Create CSV content from students data
      const headers = [
        "Student ID", 
        "Full Name", 
        "Certificate ID", 
        "Gender", 
        "Phone Number",
        "Department", 
        "Academic Year", 
        "GPA", 
        "Grade",
        "Admission Date", 
        "Graduation Date", 
        "Status"
      ];
      
      // Get filtered students if filter is active, otherwise use all students
      const dataToExport = isFilterActive ? filteredStudents : students;
      
      if (dataToExport.length === 0) {
        toast.error("No students to export");
        return;
      }
      
      // Format the data
      const csvRows = [
        headers.join(','), // Add headers row
        ...dataToExport.map(student => [
          student.student_id,
          `"${student.full_name}"`, // Quote names to handle commas in names
          student.certificate_id || '',
          student.gender,
          student.phone_number || '',
          `"${student.department}"`, // Quote department to handle commas
          student.academic_year,
          student.gpa,
          student.grade,
          student.admission_date ? new Date(student.admission_date).toISOString().split('T')[0] : '',
          student.graduation_date ? new Date(student.graduation_date).toISOString().split('T')[0] : '',
          student.status
        ].join(','))
      ];
      
      // Create a blob and download
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      
      // Create filename with date
      const date = new Date().toISOString().split('T')[0];
      const filterInfo = isFilterActive ? '-filtered' : '';
      link.setAttribute('download', `students-export${filterInfo}-${date}.csv`);
      
      // Programmatically click the link to trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Log the export action
      auditLogApi.logAction("Export Students", `Exported ${dataToExport.length} student records to CSV`);
      
      toast.success(`Successfully exported ${dataToExport.length} students`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Error exporting students: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };
  
  return (
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
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleExportStudents}
                title="Export students data"
              >
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
  );
};

export default StudentList;
