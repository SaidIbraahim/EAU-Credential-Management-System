import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Student } from "@/types";
import { auditLogApi } from "@/api/apiClient";
import { toast } from "sonner";
import StudentFilters from "./StudentFilters";

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
  
  const handleExportStudents = () => {
    try {
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
      
      const dataToExport = isFilterActive ? filteredStudents : students;
      
      if (dataToExport.length === 0) {
        toast.error("No students to export");
        return;
      }
      
      const csvRows = [
        headers.join(','), 
        ...dataToExport.map(student => [
          student.student_id,
          `"${student.full_name}"`,
          student.certificate_id || '',
          student.gender,
          student.phone_number || '',
          `"${student.department}"`,
          student.academic_year,
          student.gpa,
          student.grade,
          student.admission_date ? new Date(student.admission_date).toISOString().split('T')[0] : '',
          student.graduation_date ? new Date(student.graduation_date).toISOString().split('T')[0] : '',
          student.status
        ].join(','))
      ];
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      
      const date = new Date().toISOString().split('T')[0];
      const filterInfo = isFilterActive ? '-filtered' : '';
      link.setAttribute('download', `students-export${filterInfo}-${date}.csv`);
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
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
        <StudentFilters 
          searchQuery={searchQuery}
          searchField={searchField}
          filters={filters}
          onSearchChange={setSearchQuery}
          onSearchFieldChange={setSearchField}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
          activeFilterCount={activeFilterCount}
        />
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
