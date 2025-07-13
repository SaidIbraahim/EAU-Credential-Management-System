
import { AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Student } from "@/types";

interface DuplicateWarningProps {
  duplicates: Student[];
}

const DuplicateWarning = ({ duplicates }: DuplicateWarningProps) => {
  if (duplicates.length === 0) return null;

  return (
    <Alert className="bg-yellow-50 border-yellow-200">
      <AlertCircle className="h-4 w-4 text-yellow-600" />
      <AlertTitle className="text-yellow-800">Warning: Duplicate Students</AlertTitle>
      <AlertDescription className="text-yellow-700">
        <p className="mb-2">The following students already exist in the system:</p>
        <ul className="list-disc pl-5 space-y-1">
          {duplicates.map((student, index) => (
            <li key={index}>{student.full_name} (ID: {student.student_id})</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
};

export default DuplicateWarning;
