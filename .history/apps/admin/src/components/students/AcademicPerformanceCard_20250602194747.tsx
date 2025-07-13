import { Award, GraduationCap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Extended Student interface to match actual usage in codebase
interface ExtendedStudent {
  gpa: number;
  grade: string;
  [key: string]: any; // For other fields
}

interface AcademicPerformanceCardProps {
  student: ExtendedStudent;
  isEditing: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const AcademicPerformanceCard = ({
  student,
  isEditing,
  onInputChange
}: AcademicPerformanceCardProps) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Award className="h-5 w-5 text-primary-500" />
          Academic Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="gpa">GPA</Label>
              {isEditing ? (
                <div className="flex items-center mt-1">
                  <GraduationCap className="h-4 w-4 mr-2 text-gray-400" />
                  <Input
                    id="gpa"
                    name="gpa"
                    type="number"
                    step="0.1"
                    min="0"
                    max="4"
                    value={student.gpa}
                    onChange={onInputChange}
                    placeholder="Enter GPA"
                  />
                </div>
              ) : (
                <div className="flex items-center mt-1 p-2 bg-gray-50 rounded-md border border-gray-200">
                  <GraduationCap className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{student.gpa || "—"}</span>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="grade">Grade</Label>
              {isEditing ? (
                <div className="flex items-center mt-1">
                  <Award className="h-4 w-4 mr-2 text-gray-400" />
                  <Input
                    id="grade"
                    name="grade"
                    value={student.grade}
                    onChange={onInputChange}
                    placeholder="Enter grade"
                  />
                </div>
              ) : (
                <div className="flex items-center mt-1 p-2 bg-gray-50 rounded-md border border-gray-200">
                  <Award className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{student.grade || "—"}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AcademicPerformanceCard; 