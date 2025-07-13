import { Student } from "@/types";
import { Button } from "@/components/ui/button";
import CsvUploader from "./import/CsvUploader";
import ZipUploader from "./import/ZipUploader";
import ImportErrorAlert from "./import/ImportErrorAlert";
import DuplicateWarning from "./import/DuplicateWarning";
import StudentPreviewTable from "./import/StudentPreviewTable";
import ImportActionButtons from "./import/ImportActionButtons";
import { useStudentImport } from "./import/useStudentImport";

interface ImportStudentsProps {
  students: Student[];
  onImportSuccess: () => void;
}

const ImportStudents = ({ students, onImportSuccess }: ImportStudentsProps) => {
  const {
    csvFile,
    zipFile,
    importedStudents,
    isLoading,
    errors,
    duplicates,
    handleCsvFileChange,
    handleZipFileChange,
    handleImport,
    handleConfirmImport,
    resetState
  } = useStudentImport(students, onImportSuccess);

  // Calculate import summary
  const totalStudents = importedStudents.length;
  const duplicateCount = duplicates.length;
  const validStudentsToImport = totalStudents - duplicateCount;

  // Debug: Log state changes
  console.log('🔍 ImportStudents state:', {
    csvFile: csvFile ? `${csvFile.name} (${csvFile.size} bytes)` : 'None',
    zipFile: zipFile ? `${zipFile.name} (${zipFile.size} bytes)` : 'None',
    isLoading,
    buttonShouldBeDisabled: !csvFile || isLoading,
    totalStudents,
    duplicateCount
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <ImportErrorAlert errors={errors} />
      
      <div className="grid grid-cols-1 gap-6">
        <CsvUploader 
          onFileChange={handleCsvFileChange} 
          csvFile={csvFile} 
        />
        
        <ZipUploader 
          onFileChange={handleZipFileChange} 
          zipFile={zipFile} 
        />
        
        <div className="flex flex-col items-end gap-2">
          {/* File Status Indicator */}
          <div className="text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span className={csvFile ? "text-green-600" : "text-gray-400"}>
                📄 CSV: {csvFile ? "✅ Ready" : "❌ Required"}
              </span>
              <span className={zipFile ? "text-blue-600" : "text-gray-400"}>
                📁 ZIP: {zipFile ? "✅ Ready" : "⚪ Optional"}
              </span>
            </div>
          </div>
          
          <Button 
            className="bg-primary-500 hover:bg-primary-600 text-white"
            disabled={!csvFile || isLoading}
            onClick={handleImport}
          >
            {isLoading ? 'Processing...' : 'Import Data'}
          </Button>
          
          {!csvFile && (
            <p className="text-xs text-red-500">
              CSV file is required to import student data
            </p>
          )}
        </div>
        
        <DuplicateWarning duplicates={duplicates} />
        
        {importedStudents.length > 0 && (
          <>
            {/* Import Summary */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">📊 Import Summary</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{totalStudents}</div>
                  <div className="text-blue-700">Total in CSV</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{duplicateCount}</div>
                  <div className="text-yellow-700">Duplicates (Skip)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{validStudentsToImport}</div>
                  <div className="text-green-700">Will Import</div>
                </div>
              </div>
              {validStudentsToImport > 0 && (
                <div className="mt-3 text-sm text-blue-700">
                  ✅ Ready to import {validStudentsToImport} new student{validStudentsToImport !== 1 ? 's' : ''}
                  {duplicateCount > 0 && ` (${duplicateCount} duplicate${duplicateCount !== 1 ? 's' : ''} will be skipped)`}
                </div>
              )}
            </div>
            
            <StudentPreviewTable students={importedStudents} />
            <ImportActionButtons
              isLoading={isLoading}
              hasErrors={errors.length > 0}
              onCancel={resetState}
              onConfirm={handleConfirmImport}
              totalStudents={totalStudents}
              duplicateCount={duplicateCount}
              validStudentsCount={validStudentsToImport}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ImportStudents;
