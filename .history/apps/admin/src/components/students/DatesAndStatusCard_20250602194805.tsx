import { Calendar, CheckCircle, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Extended Student interface to match actual usage in codebase
interface ExtendedStudent {
  graduation_date?: Date;
  status: 'cleared' | 'un-cleared';
  [key: string]: any; // For other fields
}

interface DatesAndStatusCardProps {
  student: ExtendedStudent;
  isEditing: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const DatesAndStatusCard = ({
  student,
  isEditing,
  onInputChange
}: DatesAndStatusCardProps) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary-500" />
          Important Dates & Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="graduation_date">Graduation Date</Label>
              {isEditing ? (
                <div className="flex items-center mt-1">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  <Input
                    id="graduation_date"
                    name="graduation_date"
                    type="date"
                    value={student.graduation_date 
                      ? new Date(student.graduation_date).toISOString().split('T')[0] 
                      : ''
                    }
                    onChange={onInputChange}
                  />
                </div>
              ) : (
                <div className="flex items-center mt-1 p-2 bg-gray-50 rounded-md border border-gray-200">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  <span>
                    {student.graduation_date 
                      ? new Date(student.graduation_date).toLocaleDateString() 
                      : "—"
                    }
                  </span>
                </div>
              )}
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              {isEditing ? (
                <div className="flex gap-4 mt-1">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="status"
                      value="cleared"
                      checked={student.status === 'cleared'}
                      onChange={onInputChange}
                      className="mr-2"
                    />
                    <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                    Cleared
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="status"
                      value="un-cleared"
                      checked={student.status === 'un-cleared'}
                      onChange={onInputChange}
                      className="mr-2"
                    />
                    <AlertCircle className="h-4 w-4 mr-1 text-yellow-500" />
                    Uncleared
                  </label>
                </div>
              ) : (
                <div className="flex items-center mt-1 p-2 bg-gray-50 rounded-md border border-gray-200">
                  {student.status === 'cleared' ? (
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      <span className="text-green-700">Cleared</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2 text-yellow-500" />
                      <span className="text-yellow-700">Uncleared</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DatesAndStatusCard; 