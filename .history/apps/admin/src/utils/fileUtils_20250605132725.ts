import Papa from 'papaparse';
import { Student } from '@/types';

// Helper function to find entity ID by name
const findEntityIdByName = (entities: any[], name: string, entityType: string): number => {
  console.log(`🔍 Looking up ${entityType}:`, { name, entitiesCount: entities?.length });
  
  if (!entities || entities.length === 0) {
    throw new Error(`${entityType} data not available. Please refresh and try again.`);
  }
  
  // Add safety check for name parameter
  if (!name || typeof name !== 'string') {
    throw new Error(`${entityType} name is invalid: "${name}". Please check your CSV data.`);
  }
  
  // Debug: Log first few entities to see their structure
  console.log(`📋 Available ${entityType}s:`, entities.slice(0, 3).map(e => ({ 
    id: e?.id, 
    name: e?.name, 
    academicYear: e?.academicYear 
  })));
  
  const entity = entities.find(item => {
    // Handle different field names for different entity types
    let itemName: string;
    
    if (entityType === 'Academic Year') {
      // Academic years use 'academicYear' field
      itemName = item?.academicYear;
    } else {
      // Departments and faculties use 'name' field
      itemName = item?.name;
    }
    
    // Add safety check for item name
    if (!item || !itemName || typeof itemName !== 'string') {
      console.warn(`⚠️ Invalid ${entityType} item:`, item);
      return false;
    }
    
    try {
      return itemName.toLowerCase().trim() === name.toLowerCase().trim();
    } catch (error) {
      console.error(`❌ Error comparing ${entityType} names:`, { itemName, name, error });
      return false;
    }
  });
  
  if (!entity) {
    // Get available names based on entity type
    const availableNames = entities.map(e => {
      if (entityType === 'Academic Year') {
        return e?.academicYear;
      } else {
        return e?.name;
      }
    }).filter(Boolean);
    
    console.error(`❌ ${entityType} not found:`, { 
      searchName: name, 
      availableNames 
    });
    throw new Error(`${entityType} "${name}" not found. Available options: ${availableNames.join(', ')}`);
  }
  
  console.log(`✅ Found ${entityType}:`, { id: entity.id, name: entity.name || entity.academicYear });
  return entity.id;
};

/**
 * Parses a CSV file containing student data
 * @param file The CSV file to parse
 * @param departments Available departments for ID lookup
 * @param faculties Available faculties for ID lookup  
 * @param academicYears Available academic years for ID lookup
 * @returns A promise that resolves to an array of Student objects
 */
export const parseCSV = (
  file: File, 
  departments: any[] = [], 
  faculties: any[] = [], 
  academicYears: any[] = []
): Promise<Student[]> => {
  return new Promise((resolve, reject) => {
    // Enhanced file validation
    console.log('📁 File info:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString()
    });

    // Validate file exists and is accessible
    if (!file || file.size === 0) {
      reject(new Error("The selected file is empty or cannot be accessed. Please select a valid CSV file."));
      return;
    }

    // Validate file type more thoroughly
    const validExtensions = ['.csv'];
    const validMimeTypes = ['text/csv', 'application/csv', 'text/plain', 'application/vnd.ms-excel'];
    
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    const isValidExtension = validExtensions.includes(fileExtension);
    const isValidMimeType = validMimeTypes.includes(file.type) || file.type === '';

    if (!isValidExtension) {
      reject(new Error(`Invalid file format. Please upload a CSV file. Current file: ${file.name}`));
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      reject(new Error("CSV file is too large. Maximum allowed size is 10MB."));
      return;
    }

    // Check if file might be locked (common issue with Excel files)
    if (file.name.startsWith('~$')) {
      reject(new Error("The file appears to be a temporary Excel file. Please close Excel and try uploading the original CSV file."));
      return;
    }

    console.log('🔄 Starting CSV parsing...');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        try {
          console.log('📊 Papa Parse results:', {
            rowCount: results.data.length,
            errors: results.errors.length,
            meta: results.meta
          });

          if (results.errors && results.errors.length > 0) {
            // Check for file reading errors specifically
            const criticalErrors = results.errors.filter(err => 
              err.type === 'Delimiter' || err.type === 'Quotes' || err.message.includes('permission')
            );
            
            if (criticalErrors.length > 0) {
              console.error('❌ Critical parsing errors:', criticalErrors);
              reject(new Error(`CSV file reading error: ${criticalErrors[0].message}. Please ensure the file is not open in another application and try again.`));
              return;
            }
            
            // Log non-critical errors but continue
            console.warn('⚠️ CSV parsing warnings:', results.errors);
          }
          
          // Check if file is empty
          if (results.data.length === 0) {
            reject(new Error("The CSV file is empty or all rows were skipped. Please upload a file with student data."));
            return;
          }
          
          // Validate required columns exist
          const firstRow = results.data[0] as any;
          const requiredColumns = ['registration_no', 'full_name', 'department', 'faculty', 'academic_year'];
          const missingColumns = requiredColumns.filter(col => !(col in firstRow));
          
          if (missingColumns.length > 0) {
            reject(new Error(`CSV is missing required columns: ${missingColumns.join(', ')}`));
            return;
          }
          
          console.log('✅ CSV structure validated, processing rows...');
          
          // Check for duplicate certificate IDs within the file itself
          const certificateIds = new Set<string>();
          const registrationIds = new Set<string>();
          
          const students = results.data.map((row: any, index: number) => {
            try {
              // Extract and validate required fields
              const registrationId = row['registration_no']?.trim() || '';
              const certificateId = row['certificate_id']?.trim() || '';
              const fullName = row['full_name']?.trim() || '';
              const departmentName = row['department']?.trim() || '';
              const facultyName = row['faculty']?.trim() || '';
              const academicYear = row['academic_year']?.trim() || '';
              
              // Validate required fields
              if (!registrationId) {
                throw new Error(`Row ${index + 1}: Registration No is required`);
              }
              if (!fullName) {
                throw new Error(`Row ${index + 1}: Full Name is required`);
              }
              if (!departmentName) {
                throw new Error(`Row ${index + 1}: Department is required`);
              }
              if (!facultyName) {
                throw new Error(`Row ${index + 1}: Faculty is required`);
              }
              if (!academicYear) {
                throw new Error(`Row ${index + 1}: Academic Year is required`);
              }

              // Check for duplicate registration IDs within the CSV file
              if (registrationIds.has(registrationId)) {
                throw new Error(`Row ${index + 1}: Duplicate Registration No: ${registrationId} found in the CSV file`);
              }
              registrationIds.add(registrationId);
              
              // Check for duplicate certificate IDs within the CSV file (if not empty)
              if (certificateId && certificateIds.has(certificateId)) {
                throw new Error(`Row ${index + 1}: Duplicate Certificate ID: ${certificateId} found in the CSV file`);
              }
              if (certificateId) {
                certificateIds.add(certificateId);
              }

              // Find entity IDs by names
              const departmentId = findEntityIdByName(departments, departmentName, 'Department');
              const facultyId = findEntityIdByName(faculties, facultyName, 'Faculty');
              const academicYearId = findEntityIdByName(academicYears, academicYear, 'Academic Year');

              // Parse and validate other fields
              const gpa = row['gpa'] ? parseFloat(row['gpa']) : undefined;
              if (gpa !== undefined && (gpa < 0 || gpa > 4)) {
                throw new Error(`Row ${index + 1}: GPA must be between 0 and 4, got ${gpa}`);
              }

              // Parse gender
              const gender = row['gender']?.toLowerCase().trim();
              let studentGender: 'MALE' | 'FEMALE' | undefined;
              if (gender === 'male') {
                studentGender = 'MALE';
              } else if (gender === 'female') {
                studentGender = 'FEMALE';
              }

              // Parse status
              const status = row['status']?.toLowerCase().trim() === 'cleared' ? 'CLEARED' : 'UN_CLEARED';

              // Parse graduation date
              let graduationDate: string | undefined;
              if (row['graduation_date']) {
                try {
                  graduationDate = new Date(row['graduation_date']).toISOString();
                } catch {
                  throw new Error(`Row ${index + 1}: Invalid graduation date format`);
                }
              }

              // Create Student object with proper structure
              const student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'> = {
                registrationId,
                certificateId: certificateId || undefined,
                fullName,
                gender: studentGender,
                phone: row['phone_number']?.trim() || undefined,
                departmentId,
                facultyId,
                academicYearId,
                gpa,
                grade: row['grade']?.trim() || undefined,
                graduationDate,
                status
              };

              return student as Student;
            } catch (error) {
              if (error instanceof Error) {
                throw error;
              }
              throw new Error(`Row ${index + 1}: ${error}`);
            }
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
    // Check for duplicate registration IDs
    const duplicateRegistrationId = existingStudents.find(
      existingStudent => existingStudent.registrationId === newStudent.registrationId
    );
    
    // Check for duplicate certificate IDs
    const duplicateCertificateId = existingStudents.find(
      existingStudent => 
        existingStudent.certificateId && 
        newStudent.certificateId && 
        existingStudent.certificateId === newStudent.certificateId
    );
    
    if (duplicateRegistrationId) {
      duplicates.push(newStudent);
      errors.push(`Registration ID ${newStudent.registrationId} already exists in the system`);
    } else if (duplicateCertificateId) {
      duplicates.push(newStudent);
      errors.push(`Certificate ID ${newStudent.certificateId} already exists in the system`);
    } else {
      validStudents.push(newStudent);
    }
  });
  
  return { validStudents, duplicates, errors };
};
