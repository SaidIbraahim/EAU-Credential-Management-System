import { Button } from "@/components/ui/button";

interface ImportActionButtonsProps {
  isLoading: boolean;
  hasErrors: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  totalStudents?: number;
  duplicateCount?: number;
  validStudentsCount?: number;
  documentCount?: number;
}

const ImportActionButtons = ({
  isLoading,
  hasErrors,
  onCancel,
  onConfirm,
  totalStudents = 0,
  duplicateCount = 0,
  validStudentsCount = 0,
  documentCount = 0
}: ImportActionButtonsProps) => {
  const willImportStudents = totalStudents - duplicateCount;
  const hasStudentsToImport = willImportStudents > 0;
  const hasDocumentsToImport = documentCount > 0;
  const hasSomethingToImport = hasStudentsToImport || hasDocumentsToImport;
  
  // Define action text based on what's being imported
  const getActionText = () => {
    if (isLoading) {
      if (hasStudentsToImport && hasDocumentsToImport) {
        return 'Importing Students & Documents...';
      } else if (hasStudentsToImport) {
        return 'Importing Students...';
      } else if (hasDocumentsToImport) {
        return 'Uploading Documents...';
      }
      return 'Processing...';
    }
    
    if (hasStudentsToImport && hasDocumentsToImport) {
      return `Import ${willImportStudents} Students + ${documentCount} Documents`;
    } else if (hasStudentsToImport) {
      return `Import ${willImportStudents} Student${willImportStudents !== 1 ? 's' : ''}`;
    } else if (hasDocumentsToImport) {
      return `Upload ${documentCount} Document${documentCount !== 1 ? 's' : ''}`;
    }
    
    return 'Nothing to Import';
  };
  
  return (
    <div className="space-y-4">
      {/* Enhanced Import Summary - Only show for document uploads or when there are multiple items */}
      {(documentCount > 0 || totalStudents > 0) && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center">
            <span className="mr-2">📊</span>
            Confirm Import Details
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {/* Student Import Section */}
            {totalStudents > 0 && (
              <div className="space-y-2">
                <div className="font-medium text-gray-700 flex items-center">
                  <span className="mr-2">👥</span>
                  Student Data Import
                </div>
                <div className="ml-6 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total in CSV:</span>
                    <span className="font-medium">{totalStudents}</span>
                  </div>
                  {duplicateCount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-yellow-600">Duplicates (skip):</span>
                      <span className="font-medium text-yellow-600">{duplicateCount}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-1">
                    <span className="text-green-600 font-medium">Will Import:</span>
                    <span className="font-bold text-green-600">{willImportStudents}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Document Upload Section */}
            {documentCount > 0 && (
              <div className="space-y-2">
                <div className="font-medium text-gray-700 flex items-center">
                  <span className="mr-2">📁</span>
                  Document Upload
                </div>
                <div className="ml-6 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-purple-600 font-medium">Documents to Upload:</span>
                    <span className="font-bold text-purple-600">{documentCount}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Files will be uploaded to cloud storage and linked to existing student records
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Warning Messages */}
          {hasErrors && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              ⚠️ Please resolve errors above before continuing
            </div>
          )}
          
          {!hasSomethingToImport && (
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
              ⚠️ No new data to import. All students may be duplicates.
            </div>
          )}
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <Button 
          variant="outline" 
          onClick={onCancel}
          disabled={isLoading}
          className="px-6"
        >
          {isLoading ? 'Canceling...' : 'Cancel'}
        </Button>
        
        <Button 
          className="bg-primary-500 hover:bg-primary-600 text-white px-6"
          onClick={onConfirm}
          disabled={isLoading || hasErrors || !hasSomethingToImport}
        >
          {isLoading && (
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          )}
          {getActionText()}
        </Button>
      </div>
    </div>
  );
};

export default ImportActionButtons;
