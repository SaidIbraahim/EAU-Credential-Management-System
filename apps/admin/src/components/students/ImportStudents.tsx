import { useState } from "react";
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
  const [focusMode, setFocusMode] = useState<'both' | 'documents'>('both');
  
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

  // Auto-switch to document focus mode when ZIP is processed
  const isDocumentFocusMode = focusMode === 'documents' || (zipProcessingResults && !csvFile);

  // Debug: Log current state
  console.log('🔍 ImportStudents Debug:', {
    csvFile: csvFile?.name,
    zipFile: zipFile?.name,
    zipProcessingResults: zipProcessingResults ? {
      totalFiles: zipProcessingResults.totalFiles,
      organizedFilesCount: Object.keys(zipProcessingResults.organizedFiles).length,
      documentTypeStats: zipProcessingResults.documentTypeStats
    } : null,
    importedStudents: importedStudents.length,
    focusMode,
    isDocumentFocusMode
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <ImportErrorAlert errors={errors} />
      
      {/* Enhanced Workflow Guide with Focus Toggle */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-blue-800">📋 Import Options</h4>
          {!zipProcessingResults && !importedStudents.length && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={focusMode === 'both' ? 'default' : 'outline'}
                onClick={() => setFocusMode('both')}
                className="text-xs"
              >
                Both Modes
              </Button>
              <Button
                size="sm"
                variant={focusMode === 'documents' ? 'default' : 'outline'}
                onClick={() => setFocusMode('documents')}
                className="text-xs"
              >
                Documents Only
              </Button>
            </div>
          )}
        </div>
        
        {isDocumentFocusMode ? (
          <div className="p-3 bg-white rounded border text-center">
            <div className="font-medium mb-1 text-blue-800">📁 Document Upload Mode</div>
            <div className="text-xs text-blue-700">Upload documents for existing students using ZIP files</div>
          </div>
        ) : (
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
        )}
      </div>
      
      {/* Dynamic Layout Based on Focus Mode */}
      <div className={isDocumentFocusMode ? "space-y-4" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
        
        {/* CSV Uploader - Hidden in Document Focus Mode */}
        {!isDocumentFocusMode && (
          <CsvUploader 
            onFileChange={handleCsvFileChange} 
            csvFile={csvFile} 
          />
        )}
        
        {/* ZIP Uploader - Full Width in Document Focus Mode */}
        <div className={isDocumentFocusMode ? "" : ""}>
          <ZipUploader 
            onFileChange={handleZipFileChange} 
            zipFile={zipFile} 
          />
        </div>
        
        {/* Upload Controls - Only show initial button, remove duplicate processing buttons */}
        {!zipProcessingResults && !importedStudents.length && (
          <div className={`${isDocumentFocusMode ? 'mt-4' : ''} flex flex-col items-end gap-2`}>
            {/* File Status Indicator */}
            <div className="text-sm text-gray-600">
              <div className="flex items-center gap-4">
                {!isDocumentFocusMode && (
                  <span className={csvFile ? "text-green-600" : "text-gray-400"}>
                    📄 CSV: {csvFile ? "✅ Ready" : "⚪ Optional"}
                  </span>
                )}
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
              {isLoading ? 'Processing...' : (isDocumentFocusMode ? 'Process Documents' : 'Import Data')}
            </Button>
            
            {!csvFile && !zipFile && (
              <p className="text-xs text-red-500">
                {isDocumentFocusMode 
                  ? "Upload ZIP file with student documents"
                  : "Upload CSV (for student data) or ZIP (for documents) or both"
                }
              </p>
            )}
            
            {/* Import Mode Indicator */}
            {(csvFile || zipFile) && !isDocumentFocusMode && (
              <div className="text-xs text-blue-600">
                {csvFile && zipFile && "Will import: Student data + Documents"}
                {csvFile && !zipFile && "Will import: Student data only"}
                {!csvFile && zipFile && "Will import: Documents for existing students"}
              </div>
            )}
          </div>
        )}
        
        {/* Enhanced ZIP Processing Summary with Document Count */}
        {zipProcessingResults && (
          <div className={`${isDocumentFocusMode ? '' : 'col-span-full'}`}>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
              <h4 className="text-sm font-semibold text-green-800 mb-3">📁 Document Processing Summary</h4>
              
              {/* Enhanced Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                <div className="text-center p-3 bg-white rounded border">
                  <div className="text-2xl font-bold text-green-600">{zipProcessingResults.totalFiles}</div>
                  <div className="text-green-700 text-xs">Total Documents</div>
                </div>
                <div className="text-center p-3 bg-white rounded border">
                  <div className="text-2xl font-bold text-blue-600">{Object.keys(zipProcessingResults.organizedFiles).length}</div>
                  <div className="text-blue-700 text-xs">Students</div>
                </div>
                <div className="text-center p-3 bg-white rounded border">
                  <div className="text-2xl font-bold text-purple-600">{Object.keys(zipProcessingResults.documentTypeStats).length}</div>
                  <div className="text-purple-700 text-xs">Document Types</div>
                </div>
                <div className="text-center p-3 bg-white rounded border">
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round(zipProcessingResults.totalFiles / Object.keys(zipProcessingResults.organizedFiles).length * 10) / 10}
                  </div>
                  <div className="text-orange-700 text-xs">Docs per Student</div>
                </div>
              </div>
              
              {/* Document Type Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                {Object.entries(zipProcessingResults.documentTypeStats).map(([type, count]) => (
                  <div key={type} className="text-center p-2 bg-blue-50 rounded text-xs">
                    <div className="font-medium text-blue-800">{count}</div>
                    <div className="text-blue-600 capitalize">{type}</div>
                  </div>
                ))}
              </div>
              
              <div className="text-sm text-green-700 text-center p-2 bg-green-100 rounded">
                ✅ Ready to upload <strong>{zipProcessingResults.totalFiles} documents</strong> for <strong>{Object.keys(zipProcessingResults.organizedFiles).length} student{Object.keys(zipProcessingResults.organizedFiles).length !== 1 ? 's' : ''}</strong>
              </div>
            </div>

            {/* Single Action Button - Remove duplicate */}
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
          </div>
        )}
        
        {/* Student Data Results - Full Width */}
        {importedStudents.length > 0 && (
          <div className="col-span-full">
            {/* Compact Import Summary */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-blue-800">📊 Import Summary</h4>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-blue-600 font-medium">{totalStudents} total</span>
                  {duplicateCount > 0 && (
                    <span className="text-yellow-600 font-medium">{duplicateCount} duplicates</span>
                  )}
                  <span className="text-green-600 font-medium">{validStudentsToImport} to import</span>
                </div>
              </div>
              {validStudentsToImport > 0 && (
                <div className="mt-2 text-xs text-blue-700">
                  ✅ Ready to import {validStudentsToImport} new student{validStudentsToImport !== 1 ? 's' : ''}
                  {duplicateCount > 0 && ` (${duplicateCount} will be skipped)`}
                </div>
              )}
            </div>
            
            <StudentPreviewTable students={importedStudents} duplicates={duplicates} />
            
            <div className="mt-4">
              <ImportActionButtons
                isLoading={isLoading}
                hasErrors={errors.length > 0}
                onCancel={resetState}
                onConfirm={handleConfirmImport}
                totalStudents={totalStudents}
                duplicateCount={duplicateCount}
                validStudentsCount={validStudentsToImport}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportStudents;
