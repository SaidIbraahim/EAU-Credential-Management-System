import { User, Award, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Student } from "@/types";

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
  student: Student;
  isEditing: boolean;
  formData: Student;
  handleInputChange: (field: keyof Student, value: any) => void;
}

export function PersonalInformationCard({ 
  student, 
  isEditing, 
  formData, 
  handleInputChange 
}: PersonalInformationCardProps) {
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
              <Label htmlFor="fullName">Full Name</Label>
              {isEditing ? (
                <div className="flex items-center mt-1">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="Enter full name"
                  />
                </div>
              ) : (
                <div className="flex items-center mt-1 p-2 bg-gray-50 rounded-md border border-gray-200">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{student.fullName || "—"}</span>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="registrationId">Registration ID</Label>
              {isEditing ? (
                <div className="flex items-center mt-1">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  <Input
                    id="registrationId"
                    name="registrationId"
                    value={formData.registrationId}
                    onChange={(e) => handleInputChange('registrationId', e.target.value)}
                    placeholder="Enter registration ID"
                  />
                </div>
              ) : (
                <div className="flex items-center mt-1 p-2 bg-gray-50 rounded-md border border-gray-200">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{student.registrationId || "—"}</span>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="certificateId">Certificate ID</Label>
              {isEditing ? (
                <div className="flex items-center mt-1">
                  <Award className="h-4 w-4 mr-2 text-gray-400" />
                  <Input
                    id="certificateId"
                    name="certificateId"
                    value={formData.certificateId || ''}
                    onChange={(e) => handleInputChange('certificateId', e.target.value)}
                    placeholder="Enter certificate ID"
                  />
                </div>
              ) : (
                <div className="flex items-center mt-1 p-2 bg-gray-50 rounded-md border border-gray-200">
                  <Award className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{student.certificateId || "—"}</span>
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
                      value="MALE"
                      checked={formData.gender === 'MALE'}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="mr-2"
                    />
                    Male
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      value="FEMALE"
                      checked={formData.gender === 'FEMALE'}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="mr-2"
                    />
                    Female
                  </label>
                </div>
              ) : (
                <div className="flex items-center mt-1 p-2 bg-gray-50 rounded-md border border-gray-200">
                  <span className="capitalize">{student.gender ? (student.gender === 'MALE' ? 'Male' : 'Female') : "—"}</span>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              {isEditing ? (
                <div className="flex items-center mt-1">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
              ) : (
                <div className="flex items-center mt-1 p-2 bg-gray-50 rounded-md border border-gray-200">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{student.phone || "—"}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default PersonalInformationCard; 