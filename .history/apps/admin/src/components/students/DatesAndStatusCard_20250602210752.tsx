import { Calendar, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Student } from "@/types";

interface DatesAndStatusCardProps {
  student: Student;
  isEditing: boolean;
  formData: Student;
  handleInputChange: (field: keyof Student, value: any) => void;
}

export default function DatesAndStatusCard({ 
  student, 
  isEditing, 
  formData, 
  handleInputChange 
}: DatesAndStatusCardProps) {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'CLEARED': { variant: 'default' as const, label: 'Cleared', color: 'bg-green-100 text-green-800' },
      'UN_CLEARED': { variant: 'secondary' as const, label: 'Un-Cleared', color: 'bg-yellow-100 text-yellow-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { 
      variant: 'secondary' as const, 
      label: status, 
      color: 'bg-gray-100 text-gray-800' 
    };
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Dates and Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="graduationDate">Graduation Date</Label>
            {isEditing ? (
              <div className="flex items-center mt-1">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                <Input
                  id="graduationDate"
                  type="date"
                  value={formData.graduationDate ? new Date(formData.graduationDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleInputChange('graduationDate', e.target.value)}
                />
              </div>
            ) : (
              <div className="flex items-center mt-1 p-2 bg-gray-50 rounded-md border border-gray-200">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                <span>{student.graduationDate ? new Date(student.graduationDate).toLocaleDateString() : "—"}</span>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="status">Clearance Status</Label>
            {isEditing ? (
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLEARED">Cleared</SelectItem>
                  <SelectItem value="UN_CLEARED">Un-Cleared</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center mt-1 p-2 bg-gray-50 rounded-md border border-gray-200">
                <CheckCircle2 className="h-4 w-4 mr-2 text-gray-400" />
                {getStatusBadge(student.status)}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 