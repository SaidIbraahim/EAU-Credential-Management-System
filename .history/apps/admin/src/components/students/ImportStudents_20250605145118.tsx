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
        
        <div className="flex justify-end">
          <Button 
            className="bg-primary-500 hover:bg-primary-600 text-white"
            disabled={!csvFile || isLoading}
            onClick={handleImport}
          >
            {isLoading ? 'Processing...' : 'Import Data'}
          </Button>
        </div>
        
        <DuplicateWarning duplicates={duplicates} />
        
        {importedStudents.length > 0 && (
          <>
            {console.log('🔍 ImportStudents - importedStudents data:', importedStudents.slice(0, 2))}
            <StudentPreviewTable students={importedStudents} />
            <ImportActionButtons
              isLoading={isLoading}
              hasErrors={errors.length > 0}
              onCancel={resetState}
              onConfirm={handleConfirmImport}
              totalStudents={importedStudents.length}
              duplicateCount={duplicates.length}
              validStudentsCount={importedStudents.length - duplicates.length}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ImportStudents;
