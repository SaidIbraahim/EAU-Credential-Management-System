import { useState, useEffect } from "react";
import { Student } from "@/types";
import StudentFilters from "./StudentFilters";
import StudentTable from "./StudentTable";
import StudentExport from "./StudentExport";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";

interface StudentListProps {
  students: Student[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const StudentList = ({ 
  students, 
  isLoading, 
  currentPage, 
  totalPages, 
  onPageChange 
}: StudentListProps) => {
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
  const [filteredStudents, setFilteredStudents] = useState<Student[]>(students);
  
  useEffect(() => {
    filterStudents();
  }, [students, searchQuery, searchField, filters]);
  
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
    onPageChange(1);
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
  
  const filterStudents = () => {
    const filtered = students.filter(student => {
      let matchesSearch = true;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        switch (searchField) {
          case "registration_no":
            matchesSearch = student.registrationId.toLowerCase().includes(query);
            break;
          case "full_name":
            matchesSearch = student.fullName.toLowerCase().includes(query);
            break;
          case "certificate_id":
            matchesSearch = student.certificateId?.toLowerCase().includes(query) || false;
            break;
          case "all":
          default:
            matchesSearch = 
              student.fullName.toLowerCase().includes(query) ||
              student.registrationId.toLowerCase().includes(query) ||
              (student.certificateId?.toLowerCase().includes(query) || false) ||
              (student.department?.name?.toLowerCase().includes(query) || false) ||
              (student.faculty?.name?.toLowerCase().includes(query) || false);
        }
      }
      
      const matchesDepartment = !filters.department || 
                              filters.department === "all_departments" || 
                              student.department?.name === filters.department;
      
      const matchesStatus = !filters.status || 
                          filters.status === "all_status" || 
                          student.status === filters.status;
      
      const matchesAcademicYear = !filters.academicYear || 
                                filters.academicYear === "all_years" || 
                                student.academicYear?.academicYear === filters.academicYear;
      
      const matchesGpa = !filters.gpaRange || 
                        filters.gpaRange === "all_gpas" || 
                        (student.gpa ? getGpaRangeFilter(student.gpa, filters.gpaRange) : true);
      
      const matchesGender = !filters.gender || 
                          filters.gender === "all_genders" || 
                          student.gender === filters.gender;
      
      return matchesSearch && matchesDepartment && matchesStatus && 
            matchesAcademicYear && matchesGpa && matchesGender;
    });
    
    setFilteredStudents(filtered);
    setIsFilterActive(activeFilterCount > 0);
  };
  
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };
  
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Compact Filter Section */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
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
          <div className="flex-shrink-0 pt-1">
            <StudentExport 
              students={students}
              filteredStudents={filteredStudents}
              isFilterActive={isFilterActive}
            />
          </div>
        </div>
      </div>
      
      {/* Table Section */}
      <div className="overflow-x-auto">
        <StudentTable students={filteredStudents} isLoading={isLoading} />
      </div>
      
      {/* Compact Pagination */}
      <div className="px-3 py-2 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">
            Showing {filteredStudents.length} of {students.length} students
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={handlePreviousPage} 
                  className={`h-7 px-2 text-xs ${currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
                />
              </PaginationItem>
              
              <PaginationItem className="flex items-center px-2">
                <span className="text-xs text-gray-600">
                  {currentPage} / {totalPages}
                </span>
              </PaginationItem>
              
              <PaginationItem>
                <PaginationNext 
                  onClick={handleNextPage} 
                  className={`h-7 px-2 text-xs ${currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
};

export default StudentList;
