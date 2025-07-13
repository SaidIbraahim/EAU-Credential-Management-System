import { GraduationCap, BookOpen, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Student, Faculty, Department, AcademicYear } from "@/types";

interface AcademicInformationCardProps {
  student: Student;
  isEditing: boolean;
  formData: Student;
  handleInputChange: (field: keyof Student, value: any) => void;
  faculties: Faculty[];
  departments: Department[];
  academicYears: AcademicYear[];
}

export function AcademicInformationCard({ 
  student, 
  isEditing, 
  formData, 
  handleInputChange,
  faculties,
  departments,
  academicYears
}: AcademicInformationCardProps) {
  const filteredDepartments = departments.filter(dept => dept.facultyId === formData.facultyId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Academic Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="facultyId">Faculty</Label>
            {isEditing ? (
              <Select
                value={formData.facultyId?.toString() || ''}
                onValueChange={(value) => {
                  handleInputChange('facultyId', parseInt(value));
                  // Reset department when faculty changes
                  handleInputChange('departmentId', 0);
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select faculty" />
                </SelectTrigger>
                <SelectContent>
                  {faculties.map((faculty) => (
                    <SelectItem key={faculty.id} value={faculty.id.toString()}>
                      {faculty.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="p-2 border rounded bg-gray-50 mt-1">
                {student.faculty?.name || 'N/A'}
              </div>
            )}
          </div>
          
          <div>
            <Label htmlFor="departmentId">Department</Label>
            {isEditing ? (
              <Select
                value={formData.departmentId?.toString() || ''}
                onValueChange={(value) => handleInputChange('departmentId', parseInt(value))}
                disabled={!formData.facultyId}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {filteredDepartments.map((department) => (
                    <SelectItem key={department.id} value={department.id.toString()}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="p-2 border rounded bg-gray-50 mt-1">
                {student.department?.name || 'N/A'}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="academicYearId">Academic Year</Label>
            {isEditing ? (
              <Select
                value={formData.academicYearId?.toString() || ''}
                onValueChange={(value) => handleInputChange('academicYearId', parseInt(value))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select academic year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id.toString()}>
                      {year.academicYear}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="p-2 border rounded bg-gray-50 mt-1">
                {student.academicYear?.academicYear || 'N/A'}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AcademicInformationCard; 