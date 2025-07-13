import { User, Award, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Extended Student interface to match actual usage in codebase
interface ExtendedStudent {
  student_id: string;
  certificate_id?: string;
  full_name: string;
  gender: 'male' | 'female';
  phone_number?: string;
  [key: string]: any; // For other fields
}

interface PersonalInformationCardProps {
  student: ExtendedStudent;
  isEditing: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const PersonalInformationCard = ({
  student,
  isEditing,
  onInputChange
}: PersonalInformationCardProps) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5 text-primary-500" />
          Personal Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="student_id">Registration Number</Label>
              {isEditing ? (
                <div className="flex items-center mt-1">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  <Input
                    id="student_id"
                    name="student_id"
                    value={student.student_id}
                    onChange={onInputChange}
                    placeholder="e.g. GRW-BCS-2005"
                  />
                </div>
              ) : (
                <div className="flex items-center mt-1 p-2 bg-gray-50 rounded-md border border-gray-200">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{student.student_id || "—"}</span>
                </div>
              )}
              {isEditing && (
                <p className="text-xs text-gray-500 mt-1">Format: GRW-BCS-2005, GRW-BBA-2005, etc.</p>
              )}
            </div>

            <div>
              <Label htmlFor="certificate_id">Certificate Serial No</Label>
              {isEditing ? (
                <div className="flex items-center mt-1">
                  <Award className="h-4 w-4 mr-2 text-gray-400" />
                  <Input
                    id="certificate_id"
                    name="certificate_id"
                    value={student.certificate_id || ''}
                    onChange={onInputChange}
                    placeholder="e.g. 8261"
                    maxLength={4}
                  />
                </div>
              ) : (
                <div className="flex items-center mt-1 p-2 bg-gray-50 rounded-md border border-gray-200">
                  <Award className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{student.certificate_id || "—"}</span>
                </div>
              )}
              {isEditing && (
                <p className="text-xs text-gray-500 mt-1">Four-digit certificate number</p>
              )}
            </div>

            <div>
              <Label htmlFor="full_name">Full Name</Label>
              {isEditing ? (
                <div className="flex items-center mt-1">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  <Input
                    id="full_name"
                    name="full_name"
                    value={student.full_name}
                    onChange={onInputChange}
                    placeholder="Enter full name"
                  />
                </div>
              ) : (
                <div className="flex items-center mt-1 p-2 bg-gray-50 rounded-md border border-gray-200">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{student.full_name || "—"}</span>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="gender">Gender</Label>
              {isEditing ? (
                <div className="flex gap-4 mt-1">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={student.gender === 'male'}
                      onChange={onInputChange}
                      className="mr-2"
                    />
                    Male
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={student.gender === 'female'}
                      onChange={onInputChange}
                      className="mr-2"
                    />
                    Female
                  </label>
                </div>
              ) : (
                <div className="flex items-center mt-1 p-2 bg-gray-50 rounded-md border border-gray-200">
                  <span className="capitalize">{student.gender || "—"}</span>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="phone_number">Phone Number</Label>
              {isEditing ? (
                <div className="flex items-center mt-1">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  <Input
                    id="phone_number"
                    name="phone_number"
                    value={student.phone_number || ''}
                    onChange={onInputChange}
                    placeholder="Enter phone number"
                  />
                </div>
              ) : (
                <div className="flex items-center mt-1 p-2 bg-gray-50 rounded-md border border-gray-200">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{student.phone_number || "—"}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalInformationCard; 