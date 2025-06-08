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
      <AlertTitle className="text-yellow-800">
        {duplicates.length} Duplicate Student{duplicates.length !== 1 ? 's' : ''} Found
      </AlertTitle>
      <AlertDescription className="text-yellow-700">
        <p className="text-sm">
          These students already exist and will be skipped during import. 
          View the data preview below to see highlighted duplicates.
        </p>
      </AlertDescription>
    </Alert>
  );
};

export default DuplicateWarning;
