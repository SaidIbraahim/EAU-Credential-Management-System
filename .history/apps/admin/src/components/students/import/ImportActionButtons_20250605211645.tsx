import { Button } from "@/components/ui/button";

interface ImportActionButtonsProps {
  isLoading: boolean;
  hasErrors: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  totalStudents?: number;
  duplicateCount?: number;
  validStudentsCount?: number;
  documentCount?: number; // Add document count for document-only imports
}

const ImportActionButtons = ({
  isLoading,
  hasErrors,
  onCancel,
  onConfirm,
  totalStudents = 0,
  duplicateCount = 0,
  validStudentsCount = 0
}: ImportActionButtonsProps) => {
  const willImport = totalStudents - duplicateCount;
  
  return (
    <div className="mt-4">
      {/* Import Summary */}
      {totalStudents > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="text-sm font-medium text-blue-800 mb-1">Import Summary</h4>
          <div className="text-sm text-blue-700">
            <p>• Total students in CSV: <span className="font-medium">{totalStudents}</span></p>
            {duplicateCount > 0 && (
              <p>• Duplicates to skip: <span className="font-medium text-yellow-600">{duplicateCount}</span></p>
            )}
            <p>• New students to import: <span className="font-medium text-green-600">{willImport}</span></p>
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          className="mr-2"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button 
          className="bg-primary-500 hover:bg-primary-600 text-white"
          onClick={onConfirm}
          disabled={isLoading || hasErrors || willImport === 0}
        >
          {isLoading ? 'Processing...' : `Import ${willImport} Student${willImport !== 1 ? 's' : ''}`}
        </Button>
      </div>
    </div>
  );
};

export default ImportActionButtons;
