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
    zipProcessingResults,
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

  // Debug: Log current state
  console.log('🔍 ImportStudents Debug:', {
    csvFile: csvFile?.name,
    zipFile: zipFile?.name,
    zipProcessingResults: zipProcessingResults ? {
      totalFiles: zipProcessingResults.totalFiles,
      organizedFilesCount: Object.keys(zipProcessingResults.organizedFiles).length,
      documentTypeStats: zipProcessingResults.documentTypeStats
    } : null,
    importedStudents: importedStudents.length
  });



  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <ImportErrorAlert errors={errors} />
      
      {/* Workflow Guide */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">📋 Import Options</h4>
        <div className="text-sm text-blue-700 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-white rounded border">
            <div className="font-medium mb-1">📄 CSV Only</div>
            <div className="text-xs">Import student data</div>
          </div>
          <div className="p-3 bg-white rounded border">
            <div className="font-medium mb-1">📁 ZIP Only</div>
            <div className="text-xs">Add documents to existing students</div>
          </div>
          <div className="p-3 bg-white rounded border">
            <div className="font-medium mb-1">📄 + 📁 Both</div>
            <div className="text-xs">Import students + documents</div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                📄 CSV: {csvFile ? "✅ Ready" : "⚪ Optional"}
              </span>
              <span className={zipFile ? "text-blue-600" : "text-gray-400"}>
                📁 ZIP: {zipFile ? "✅ Ready" : "⚪ Optional"}
              </span>
            </div>
          </div>
          
          <Button 
            className="bg-primary-500 hover:bg-primary-600 text-white"
            disabled={(!csvFile && !zipFile) || isLoading}
            onClick={handleImport}
          >
            {isLoading ? 'Processing...' : 'Import Data'}
          </Button>
          
          {!csvFile && !zipFile && (
            <p className="text-xs text-red-500">
              Upload CSV (for student data) or ZIP (for documents) or both
            </p>
          )}
          
          {/* Import Mode Indicator */}
          {(csvFile || zipFile) && (
            <div className="text-xs text-blue-600">
              {csvFile && zipFile && "Will import: Student data + Documents"}
              {csvFile && !zipFile && "Will import: Student data only"}
              {!csvFile && zipFile && "Will import: Documents for existing students"}
            </div>
          )}
        </div>
        
        {/* DuplicateWarning removed - duplicates are now highlighted directly in the table */}
        
        {/* ZIP Processing Summary - Show when ZIP is processed */}
        {zipProcessingResults && (
          <>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="text-sm font-semibold text-green-800 mb-2">📁 Document Processing Summary</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{zipProcessingResults.totalFiles}</div>
                  <div className="text-green-700">Total Files</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{Object.keys(zipProcessingResults.organizedFiles).length}</div>
                  <div className="text-blue-700">Students</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{Object.keys(zipProcessingResults.documentTypeStats).length}</div>
                  <div className="text-purple-700">Doc Types</div>
                </div>
              </div>
              <div className="mt-3 text-sm text-green-700">
                ✅ Ready to upload documents for {Object.keys(zipProcessingResults.organizedFiles).length} student{Object.keys(zipProcessingResults.organizedFiles).length !== 1 ? 's' : ''}
              </div>
              {/* Document type breakdown */}
              <div className="mt-2 text-xs text-green-600">
                Types: {Object.entries(zipProcessingResults.documentTypeStats).map(([type, count]) => `${count} ${type}`).join(', ')}
              </div>
            </div>

            <ImportActionButtons
              isLoading={isLoading}
              hasErrors={errors.length > 0}
              onCancel={resetState}
              onConfirm={handleConfirmImport}
              totalStudents={0}
              duplicateCount={0}
              validStudentsCount={0}
              documentCount={zipProcessingResults.totalFiles}
            />
          </>
        )}
        
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
            
            <StudentPreviewTable students={importedStudents} duplicates={duplicates} />
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
