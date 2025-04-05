import Papa from 'papaparse';
import { Student } from '@/types';

/**
 * Parses a CSV file containing student data
 * @param file The CSV file to parse
 * @returns A promise that resolves to an array of Student objects
 */
export const parseCSV = (file: File): Promise<Student[]> => {
  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.type.includes('csv') && !file.name.endsWith('.csv')) {
      reject(new Error("Invalid file format. Please upload a CSV file."));
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      reject(new Error("CSV file is too large. Maximum allowed size is 10MB."));
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          if (results.errors && results.errors.length > 0) {
            // Check if there are parsing errors from PapaParse
            const errorMessages = results.errors.map(err => `Row ${err.row}: ${err.message}`);
            reject(new Error(`CSV parsing errors: ${errorMessages.join(', ')}`));
            return;
          }
          
          // Check if file is empty
          if (results.data.length === 0) {
            reject(new Error("The CSV file is empty. Please upload a file with student data."));
            return;
          }
          
          // Validate required columns exist
          const firstRow = results.data[0] as any;
          const requiredColumns = ['Student ID', 'Full Name', 'Department'];
          const missingColumns = requiredColumns.filter(col => !(col in firstRow));
          
          if (missingColumns.length > 0) {
            reject(new Error(`CSV is missing required columns: ${missingColumns.join(', ')}`));
            return;
          }
          
          // Check for duplicate certificate IDs within the file itself
          const certificateIds = new Set<string>();
          const studentIds = new Set<string>();
          
          const students = results.data.map((row: any, index: number) => {
            // Convert CSV data to Student type with additional validation
            const student: Partial<Student> = {
              id: index + 1, // Temporary ID until saved to database
              student_id: row['Student ID']?.trim() || '',
              certificate_id: row['Certificate ID']?.trim() || '',
              full_name: row['Full Name']?.trim() || '',
              gender: (row['Gender']?.toLowerCase() === 'male' ? 'male' : 'female') as 'male' | 'female',
              phone_number: row['Phone Number']?.trim() || '',
              department: row['Department']?.trim() || '',
              academic_year: row['Academic Year']?.trim() || '',
              gpa: parseFloat(row['GPA']) || 0,
              grade: row['Grade']?.trim() || '',
              admission_date: row['Admission Date'] ? new Date(row['Admission Date']) : new Date(),
              graduation_date: row['Graduation Date'] ? new Date(row['Graduation Date']) : undefined,
              status: (row['Status']?.toLowerCase() === 'cleared' ? 'cleared' : 'un-cleared') as 'cleared' | 'un-cleared',
              created_at: new Date(),
              updated_at: new Date(),
            };

            // Validate student_id is not empty for each row
            if (!student.student_id) {
              throw new Error(`Row ${index + 1}: Student ID is required`);
            }

            // Validate full_name is not empty for each row
            if (!student.full_name) {
              throw new Error(`Row ${index + 1}: Full Name is required`);
            }

            // Validate department is not empty for each row
            if (!student.department) {
              throw new Error(`Row ${index + 1}: Department is required`);
            }

            // Validate GPA is between 0 and 4
            if (student.gpa !== undefined && (student.gpa < 0 || student.gpa > 4)) {
              throw new Error(`Row ${index + 1}: GPA must be between 0 and 4, got ${student.gpa}`);
            }
            
            // Check for duplicate student IDs within the CSV file
            if (studentIds.has(student.student_id)) {
              throw new Error(`Row ${index + 1}: Duplicate Student ID: ${student.student_id} found in the CSV file`);
            }
            studentIds.add(student.student_id);
            
            // Check for duplicate certificate IDs within the CSV file (if not empty)
            if (student.certificate_id && certificateIds.has(student.certificate_id)) {
              throw new Error(`Row ${index + 1}: Duplicate Certificate ID: ${student.certificate_id} found in the CSV file`);
            }
            if (student.certificate_id) {
              certificateIds.add(student.certificate_id);
            }

            return student as Student;
          });

          resolve(students);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

/**
 * Processes a ZIP file containing student documents
 * @param file The ZIP file to process
 * @returns A promise that resolves to a confirmation message
 */
export const processZipFile = async (file: File): Promise<string> => {
  // In a real implementation, this would extract the ZIP and process each file
  try {
    // Validate file type
    if (!file.type.includes('zip') && !file.name.endsWith('.zip')) {
      throw new Error("Invalid file format. Please upload a ZIP archive.");
    }
    
    // Validate zip file size
    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      throw new Error("ZIP file is too large. Maximum allowed size is 100MB.");
    }
    
    // In a real implementation, we would:
    // 1. Extract the ZIP file (using JSZip or a backend service)
    // 2. Validate the folder structure (each student should have a folder named with their student_id)
    // 3. Upload each document to cloud storage
    // 4. Associate the uploaded documents with the corresponding student in the database
    
    // Return basic information for now
    return `Processed ZIP file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
  } catch (error) {
    throw error;
  }
};

/**
 * Validates a list of students against existing data to check for duplicates
 * @param newStudents The list of new students to validate
 * @param existingStudents The list of existing students in the database
 * @returns An object containing lists of valid students, duplicates, and error messages
 */
export const validateStudents = (
  newStudents: Student[], 
  existingStudents: Student[]
): { 
  validStudents: Student[],
  duplicates: Student[],
  errors: string[] 
} => {
  const errors: string[] = [];
  const duplicates: Student[] = [];
  const validStudents: Student[] = [];
  
  // Check for duplicates with existing data
  newStudents.forEach(newStudent => {
    // Check for duplicate student IDs
    const duplicateStudentId = existingStudents.find(
      existingStudent => existingStudent.student_id === newStudent.student_id
    );
    
    // Check for duplicate certificate IDs
    const duplicateCertificateId = existingStudents.find(
      existingStudent => 
        existingStudent.certificate_id && 
        newStudent.certificate_id && 
        existingStudent.certificate_id === newStudent.certificate_id
    );
    
    if (duplicateStudentId) {
      duplicates.push(newStudent);
      errors.push(`Student ID ${newStudent.student_id} already exists in the system`);
    } else if (duplicateCertificateId) {
      duplicates.push(newStudent);
      errors.push(`Certificate ID ${newStudent.certificate_id} already exists in the system`);
    } else {
      validStudents.push(newStudent);
    }
  });
  
  return { validStudents, duplicates, errors };
};
