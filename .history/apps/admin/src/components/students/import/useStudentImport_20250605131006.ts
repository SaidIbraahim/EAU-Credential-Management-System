import { useState } from "react";
import { Student } from "@/types";
import { parseCSV, processZipFile, validateStudents } from "@/utils/fileUtils";
import { studentsApi, auditLogApi } from "@/api/apiClient";
import { useDataContext } from "@/contexts/DataContext";
import { toast } from "sonner";

export const useStudentImport = (
  existingStudents: Student[],
  onImportSuccess: () => void
) => {
  const { departments, faculties, academicYears, isLoading: dataContextLoading } = useDataContext();
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [importedStudents, setImportedStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [duplicates, setDuplicates] = useState<Student[]>([]);
  
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
    if (!csvFile) {
      toast.error("Please select a CSV file to import");
      return;
    }
    
    setIsLoading(true);
    setErrors([]);
    setDuplicates([]);
    
    try {
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

      const parsedStudents = await parseCSV(csvFile, departments, faculties, academicYears);
      
      const { validStudents, duplicates: foundDuplicates, errors: validationErrors } = 
        validateStudents(parsedStudents, existingStudents);
      
      setDuplicates(foundDuplicates);
      
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        toast.warning(`Found ${validationErrors.length} validation issues.`);
      }
      
      setImportedStudents(parsedStudents);
      
      if (zipFile) {
        const zipResult = await processZipFile(zipFile);
        console.log(zipResult);
        toast.success("ZIP file processed successfully");
      }
      
      toast.success(`Successfully parsed ${parsedStudents.length} students from CSV`);
    } catch (error) {
      console.error("Import error:", error);
      setErrors([`Error parsing CSV: ${error instanceof Error ? error.message : "Unknown error"}`]);
      toast.error("Error importing students: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleConfirmImport = async () => {
    if (importedStudents.length === 0) {
      toast.error("No students to import");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const studentsToImport = importedStudents.filter(
        student => !duplicates.some(dup => dup.registrationId === student.registrationId)
      );
      
      if (studentsToImport.length === 0) {
        toast.error("All students are duplicates. No new students to import.");
        setIsLoading(false);
        return;
      }
      
      console.log("Attempting to import students:", studentsToImport);
      const result = await studentsApi.bulkImport(studentsToImport);
      
      await auditLogApi.logAction("Bulk Import", `Imported ${result.count} students from CSV file`);
      
      toast.success(`Successfully imported ${result.count} students`);
      
      resetState();
      onImportSuccess();
    } catch (error) {
      console.error("Import confirmation error:", error);
      toast.error("Error confirming import: " + (error instanceof Error ? error.message : "Unknown error"));
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
  };

  return {
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
  };
};
