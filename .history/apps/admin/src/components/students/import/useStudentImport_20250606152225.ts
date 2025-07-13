import { useState, useEffect } from "react";
import { Student } from "@/types";
import { parseCSV, processZipFile, validateStudents } from "@/utils/fileUtils";
import { studentsApi, auditLogApi } from "@/api/apiClient";
import { useDataContext } from "@/contexts/DataContext";
import { toast } from "sonner";

export const useStudentImport = (
  existingStudents: Student[], // This will be ignored, we'll fetch fresh data
  onImportSuccess: () => void
) => {
  const { departments, faculties, academicYears, isLoading: dataContextLoading } = useDataContext();
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [importedStudents, setImportedStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [duplicates, setDuplicates] = useState<Student[]>([]);
  const [zipProcessingResults, setZipProcessingResults] = useState<{
    organizedFiles: {[registrationId: string]: {[docType: string]: File[]}};
    documentTypeStats: {[docType: string]: number};
    totalFiles: number;
  } | null>(null);
  const [allStudentsForValidation, setAllStudentsForValidation] = useState<Student[]>([]);

  // Fetch all students for validation when component mounts
  useEffect(() => {
    const fetchStudentsForValidation = async () => {
      try {
        console.log('🔍 Fetching all students for validation...');
        const validationData = await studentsApi.getAllForValidation();
        setAllStudentsForValidation(validationData.data);
        console.log(`✅ Loaded ${validationData.data.length} students for validation`);
      } catch (error) {
        console.error('❌ Failed to fetch students for validation:', error);
        toast.error('Failed to load existing students for validation');
      }
    };

    fetchStudentsForValidation();
  }, []);
  
  const handleCsvFileChange = (file: File) => {
    setCsvFile(file);
    setErrors([]);
    setDuplicates([]);
    setImportedStudents([]);
  };
  
  const handleZipFileChange = (file: File) => {
    setZipFile(file);
  };
  
  const handleImport = async () => {
    if (!csvFile && !zipFile) {
      toast.error("Please select a CSV file (for student data) or ZIP file (for documents)");
      return;
    }
    
    setIsLoading(true);
    setErrors([]);
    setDuplicates([]);
    
    try {
      let parsedStudents: Student[] = [];
      
      // Handle CSV import if CSV file is provided
      if (csvFile) {
        // Check if DataContext is still loading
        if (dataContextLoading) {
          throw new Error("System data is still loading. Please wait a moment and try again.");
        }

        // Check if DataContext data is loaded
        if (!departments || !faculties || !academicYears) {
          throw new Error("Reference data (departments, faculties, academic years) is not loaded yet. Please refresh the page and try again.");
        }

        if (departments.length === 0 || faculties.length === 0 || academicYears.length === 0) {
          throw new Error("Reference data is empty. Please ensure departments, faculties, and academic years are configured in the system.");
        }

        console.log("🔍 DataContext reference data:", {
          departments: departments?.length ? departments.slice(0, 2) : "No departments",
          faculties: faculties?.length ? faculties.slice(0, 2) : "No faculties", 
          academicYears: academicYears?.length ? academicYears.slice(0, 2) : "No academic years"
        });

        parsedStudents = await parseCSV(csvFile, departments, faculties, academicYears);
        
        // Use the complete student list for validation instead of limited paginated data
        console.log(`🔍 Validating against ${allStudentsForValidation.length} existing students`);
        const { validStudents, duplicates: foundDuplicates, errors: blockingErrors, duplicateWarnings } = 
          validateStudents(parsedStudents, allStudentsForValidation);
        
        setDuplicates(foundDuplicates);
        
        // Only set blocking errors that prevent import
        if (blockingErrors.length > 0) {
          setErrors(blockingErrors);
          toast.error(`Found ${blockingErrors.length} blocking validation errors.`);
        }
        
        // Show info about duplicates but don't block import
        if (duplicateWarnings.length > 0) {
          toast.warning(`Found ${duplicateWarnings.length} duplicate records. These will be skipped during import.`);
        }
        
        console.log('🔍 Setting imported students:', parsedStudents.slice(0, 2));
        setImportedStudents(parsedStudents);
        
        toast.success(`Successfully parsed ${parsedStudents.length} students from CSV`);
      }
      
      // Handle ZIP import
      if (zipFile) {
        const zipResult = await processZipFile(zipFile);
        console.log('📦 ZIP Processing Result:', zipResult);
        
        setZipProcessingResults({
          organizedFiles: zipResult.organizedFiles,
          documentTypeStats: zipResult.documentTypeStats,
          totalFiles: zipResult.totalFiles
        });
        
        if (zipResult.errors.length > 0) {
          // Add ZIP errors to the errors state so they show in the UI
          setErrors(prev => [...prev, ...zipResult.errors]);
          toast.warning(`ZIP processed with ${zipResult.errors.length} warnings. Check details below.`);
        } else {
          toast.success(`ZIP processed successfully: ${zipResult.summary}`);
        }
        
        // If only ZIP file (no CSV), we're doing document-only import
        if (!csvFile) {
          const registrationIds = Object.keys(zipResult.organizedFiles);
          toast.info(`Ready to upload documents for ${registrationIds.length} students. Click "Confirm Import" to proceed.`);
        }
      }
      
    } catch (error) {
      console.error("Import error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setErrors([`Error processing files: ${errorMessage}`]);
      toast.error("Error importing: " + errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleConfirmImport = async () => {
    // Check if we have students to import OR documents to upload
    if (importedStudents.length === 0 && !zipProcessingResults) {
      toast.error("No students or documents to import");
      return;
    }
    
    setIsLoading(true);
    
    try {
      let studentsToImport: Student[] = [];
      
      // Only process students if we have imported students
      if (importedStudents.length > 0) {
        studentsToImport = importedStudents.filter(
          student => !duplicates.some(dup => dup.registrationId === student.registrationId)
        );
        
        // Only check for duplicate students if we have students to import AND no documents
        if (studentsToImport.length === 0 && !zipProcessingResults) {
          toast.error("All students are duplicates and no documents to import.");
          setIsLoading(false);
          return;
        }
      }
      
      let studentImportCount = 0;
      let documentImportCount = 0;
      
      // Import students ONLY if we have them
      if (studentsToImport.length > 0) {
        console.log("Attempting to import students:", studentsToImport);
        console.log("First student sample:", studentsToImport[0]);
        const studentResult = await studentsApi.bulkImport(studentsToImport);
        studentImportCount = studentResult.count;
        
        await auditLogApi.logAction("Bulk Import", `Imported ${studentResult.count} students from CSV file`);
      }
      
      // Import documents if we have them
      if (zipProcessingResults && zipProcessingResults.organizedFiles) {
        const { documentsApi } = await import("@/api/apiClient");
        
        // Create FormData for bulk document upload
        const formData = new FormData();
        
        // Add all files to FormData
        let fileIndex = 0;
        for (const [registrationId, studentDocs] of Object.entries(zipProcessingResults.organizedFiles)) {
          for (const [docType, files] of Object.entries(studentDocs)) {
            for (const file of files) {
              formData.append('files', file);
              fileIndex++;
            }
          }
        }
        
        // Add organization data
        formData.append('organizationData', JSON.stringify(zipProcessingResults.organizedFiles));
        
        console.log("Attempting to import documents for", Object.keys(zipProcessingResults.organizedFiles).length, "students");
        
        const documentResult = await documentsApi.bulkUpload(formData);
        documentImportCount = documentResult.summary?.totalSuccessful || 0;
        
        await auditLogApi.logAction("Bulk Document Import", `Uploaded ${documentImportCount} documents from ZIP file`);
      }
      
      // Show success message based on what was imported
      if (studentImportCount > 0 && documentImportCount > 0) {
        toast.success(`Successfully imported ${studentImportCount} students and ${documentImportCount} documents`);
      } else if (studentImportCount > 0) {
        toast.success(`Successfully imported ${studentImportCount} students`);
      } else if (documentImportCount > 0) {
        toast.success(`Successfully uploaded ${documentImportCount} documents`);
      } else {
        toast.warning("No new data was imported");
      }
      
      resetState();
      onImportSuccess();
    } catch (error) {
      console.error("Import confirmation error:", error);
      
      // Handle API errors with more detail
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as any;
        if (apiError.response?.data?.details) {
          console.error("Validation details:", apiError.response.data.details);
          toast.error(`Validation error: ${JSON.stringify(apiError.response.data.details.slice(0, 3))}...`);
        } else if (apiError.response?.data?.error) {
          toast.error(`API error: ${apiError.response.data.error}`);
        } else {
          toast.error("Error confirming import: " + (error instanceof Error ? error.message : "Unknown error"));
        }
      } else {
        toast.error("Error confirming import: " + (error instanceof Error ? error.message : "Unknown error"));
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetState = () => {
    setCsvFile(null);
    setZipFile(null);
    setImportedStudents([]);
    setErrors([]);
    setDuplicates([]);
    setZipProcessingResults(null);
  };

  return {
    csvFile,
    zipFile,
    importedStudents,
    isLoading,
    dataContextLoading,
    errors,
    duplicates,
    zipProcessingResults,
    handleCsvFileChange,
    handleZipFileChange,
    handleImport,
    handleConfirmImport,
    resetState
  };
};
