import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Student } from "@/types";
import { auditLogApi } from "@/api/apiClient";
import { toast } from "sonner";

interface StudentExportProps {
  students: Student[];
  filteredStudents: Student[];
  isFilterActive: boolean;
}

const StudentExport = ({ students, filteredStudents, isFilterActive }: StudentExportProps) => {
  const handleExportStudents = () => {
    try {
      const headers = [
        "Registration ID", 
        "Full Name", 
        "Certificate ID", 
        "Gender", 
        "Phone Number",
        "Faculty", 
        "Department", 
        "Academic Year", 
        "GPA", 
        "Grade",
        "Graduation Date", 
        "Status",
        "Created Date"
      ];
      
      const dataToExport = isFilterActive ? filteredStudents : students;
      
      if (dataToExport.length === 0) {
        toast.error("No students to export");
        return;
      }
      
      const csvRows = [
        headers.join(','), 
        ...dataToExport.map(student => [
          student.registrationId,
          `"${student.fullName}"`,
          student.certificateId || '',
          student.gender || '',
          student.phone || '',
          `"${student.faculty?.name || ''}"`,
          `"${student.department?.name || ''}"`,
          student.academicYear?.academicYear || '',
          student.gpa || '',
          student.grade || '',
          student.graduationDate ? new Date(student.graduationDate).toISOString().split('T')[0] : '',
          student.status,
          student.createdAt ? new Date(student.createdAt).toISOString().split('T')[0] : ''
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
    <Button
      onClick={handleExportStudents}
      variant="outline"
      size="sm"
      className="ml-2"
      title="Export students to CSV"
    >
      <Download className="h-4 w-4 mr-2" />
      Export
    </Button>
  );
};

export default StudentExport;
