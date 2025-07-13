import { ArrowLeft, Save, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Student } from "@/types";

interface StudentDetailHeaderProps {
  student: Student;
  isNewStudent: boolean;
  isEditing: boolean;
  isSaving: boolean;
  onNavigateBack: () => void;
  onEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  onCancel: () => void;
}

const StudentDetailHeader = ({
  student,
  isNewStudent,
  isEditing,
  isSaving,
  onNavigateBack,
  onEdit,
  onSave,
  onDelete,
  onCancel
}: StudentDetailHeaderProps) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onNavigateBack} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {isNewStudent ? "Register New Student" : student.fullName}
            </h2>
            {!isNewStudent && (
              <p className="text-gray-500 text-sm mt-1">ID: {student.registrationId}</p>
            )}
          </div>
          {!isNewStudent && !isEditing && (
            <div className="ml-4 flex items-center">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                student.status === 'CLEARED' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {student.status === 'CLEARED' ? 'Cleared' : 'Un-Cleared'}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          {!isNewStudent && !isEditing && (
            <Button onClick={onEdit} className="bg-blue-500 hover:bg-blue-600 text-white">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          {!isNewStudent && (
            <Button 
              variant="destructive" 
              onClick={onDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
          {(isEditing || isNewStudent) && (
            <Button 
              className="bg-primary-500 hover:bg-primary-600 text-white"
              onClick={onSave}
              disabled={isSaving}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          )}
          {isEditing && !isNewStudent && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDetailHeader; 