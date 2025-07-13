import { GraduationCap, BookOpen, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Extended Student interface to match actual usage in codebase
interface ExtendedStudent {
  faculty?: string;
  department: string;
  academic_year: string;
  [key: string]: any; // For other fields
}

interface AcademicInformationCardProps {
  student: ExtendedStudent;
  isEditing: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const AcademicInformationCard = ({
  student,
  isEditing,
  onInputChange
}: AcademicInformationCardProps) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary-500" />
          Academic Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="faculty">Faculty</Label>
              {isEditing ? (
                <div className="flex items-center mt-1">
                  <BookOpen className="h-4 w-4 mr-2 text-gray-400" />
                  <Input
                    id="faculty"
                    name="faculty"
                    value={student.faculty || ''}
                    onChange={onInputChange}
                    placeholder="Enter faculty"
                  />
                </div>
              ) : (
                <div className="flex items-center mt-1 p-2 bg-gray-50 rounded-md border border-gray-200">
                  <BookOpen className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{student.faculty || "—"}</span>
                </div>
              )}
            </div>
            
            <div>
              <Label htmlFor="department">Department</Label>
              {isEditing ? (
                <div className="flex items-center mt-1">
                  <BookOpen className="h-4 w-4 mr-2 text-gray-400" />
                  <Input
                    id="department"
                    name="department"
                    value={student.department}
                    onChange={onInputChange}
                    placeholder="Enter department"
                  />
                </div>
              ) : (
                <div className="flex items-center mt-1 p-2 bg-gray-50 rounded-md border border-gray-200">
                  <BookOpen className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{student.department || "—"}</span>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="academic_year">Academic Year</Label>
              {isEditing ? (
                <div className="flex items-center mt-1">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  <Input
                    id="academic_year"
                    name="academic_year"
                    value={student.academic_year}
                    onChange={onInputChange}
                    placeholder="Enter academic year"
                  />
                </div>
              ) : (
                <div className="flex items-center mt-1 p-2 bg-gray-50 rounded-md border border-gray-200">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{student.academic_year || "—"}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AcademicInformationCard; 