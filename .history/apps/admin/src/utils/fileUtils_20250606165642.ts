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
        console.error('❌ Papa Parse error:', error);
        
        // Provide more specific error messages based on the error type
        if (error.message && error.message.includes('permission')) {
          reject(new Error("File permission error: The file cannot be read. Please ensure the file is not open in another application and try again."));
        } else if (error.message && error.message.includes('access')) {
          reject(new Error("File access error: Cannot access the selected file. Please check if the file still exists and is not locked by another application."));
        } else if (error.message && error.message.includes('encoding')) {
          reject(new Error("File encoding error: The file format may be corrupted. Please save the file as a UTF-8 CSV and try again."));
        } else {
          reject(new Error(`File reading error: ${error.message || error}. Please ensure the file is accessible and try again.`));
        }
      }
    });
  });
};

/**
 * Processes a ZIP file containing student documents
 * Expected structure: DOCUMENT_TYPE/REGISTRATION_ID.extension
 * Example: Photo/GRW-BCS-2005.jpg, Certificate/GRW-BCS-2005.pdf
 * @param file The ZIP file to process
 * @returns A promise that resolves to processing results
 */
export const processZipFile = async (file: File): Promise<{
  success: boolean;
  totalFiles: number;
  organizedFiles: {[registrationId: string]: {[docType: string]: File[]}};
  errors: string[];
  summary: string;
  documentTypeStats: {[docType: string]: number};
}> => {
  try {
    // Validate file type
    if (!file.type.includes('zip') && !file.name.endsWith('.zip')) {
      throw new Error("Invalid file format. Please upload a ZIP archive.");
    }
    
    // Validate zip file size (200MB limit for bulk operations)
    if (file.size > 200 * 1024 * 1024) {
      throw new Error("ZIP file is too large. Maximum allowed size is 200MB.");
    }
    
    // Import JSZip dynamically
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    
    // Read ZIP file
    const zipContent = await zip.loadAsync(file);
    
    console.log('📁 ZIP Structure Analysis:', {
      totalEntries: Object.keys(zipContent.files).length,
      allFiles: Object.keys(zipContent.files),
      rootFolders: Object.keys(zipContent.files)
        .filter(name => name.endsWith('/'))
        .map(name => name.replace('/', '')),
      allPaths: Object.keys(zipContent.files).slice(0, 10) // Show first 10 paths for debugging
    });
    
    const organizedFiles: {[registrationId: string]: {[docType: string]: File[]}} = {};
    const documentTypeStats: {[docType: string]: number} = {};
    const errors: string[] = [];
    let totalFiles = 0;
    
    // Define expected document types and their configurations
    const DOCUMENT_TYPES = {
      'photo': {
        extensions: ['.jpg', '.jpeg', '.png'],
        maxSize: 5 * 1024 * 1024, // 5MB
        mimeTypes: ['image/jpeg', 'image/png']
      },
      'certificate': {
        extensions: ['.pdf', '.jpg', '.jpeg', '.png'],
        maxSize: 10 * 1024 * 1024, // 10MB
        mimeTypes: ['application/pdf', 'image/jpeg', 'image/png']
      },
      'transcript': {
        extensions: ['.pdf', '.jpg', '.jpeg', '.png'],
        maxSize: 10 * 1024 * 1024, // 10MB
        mimeTypes: ['application/pdf', 'image/jpeg', 'image/png']
      },
      'supporting': {
        extensions: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
        maxSize: 10 * 1024 * 1024, // 10MB
        mimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png']
      }
    };
    
    // Process each file in the ZIP
    for (const [filePath, zipEntry] of Object.entries(zipContent.files)) {
      // Skip directories
      if (zipEntry.dir) continue;
      
      console.log('🔍 Processing file:', filePath);
      
      // Parse file path: Look for document type folder anywhere in the path
      const pathParts = filePath.split('/');
      const fileName = pathParts[pathParts.length - 1]; // Always the last part
      
      // Find document type folder in the path (can be at any level)
      let docTypeFolder = '';
      let foundDocTypeIndex = -1;
      
      // Check each path part for a valid document type folder
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i].toLowerCase();
        if (part === 'photo' || part === 'photos' || part === 'picture' || part === 'pictures' ||
            part === 'certificate' || part === 'certificates' || part === 'cert' || part === 'certs' ||
            part === 'transcript' || part === 'transcripts' || part === 'grade' || part === 'grades' ||
            part === 'supporting' || part === 'support' || part === 'other' || part === 'misc') {
          docTypeFolder = part;
          foundDocTypeIndex = i;
          break;
        }
      }
      
      if (foundDocTypeIndex === -1) {
        errors.push(`No valid document type folder found in path: ${filePath}. Valid folders: Photo, Certificate, Transcript, Supporting. Path parts: [${pathParts.slice(0, -1).join(', ')}]`);
        continue;
      }
      
      // Map folder names to document types (case-insensitive, flexible naming)
      let docType = '';
      if (docTypeFolder === 'photo' || docTypeFolder === 'photos' || docTypeFolder === 'picture' || docTypeFolder === 'pictures') {
        docType = 'photo';
      } else if (docTypeFolder === 'certificate' || docTypeFolder === 'certificates' || docTypeFolder === 'cert' || docTypeFolder === 'certs') {
        docType = 'certificate';
      } else if (docTypeFolder === 'transcript' || docTypeFolder === 'transcripts' || docTypeFolder === 'grade' || docTypeFolder === 'grades') {
        docType = 'transcript';
      } else if (docTypeFolder === 'supporting' || docTypeFolder === 'support' || docTypeFolder === 'other' || docTypeFolder === 'misc') {
        docType = 'supporting';
      } else {
        errors.push(`Invalid document type folder: "${pathParts[0]}". Valid folders: Photo, Certificate, Transcript, Supporting`);
        continue;
      }
      
      // Extract registration ID from filename (remove extension)
      const lastDotIndex = fileName.lastIndexOf('.');
      if (lastDotIndex === -1) {
        errors.push(`Invalid filename format: ${fileName}. Filename must have an extension.`);
        continue;
      }
      
      const registrationId = fileName.substring(0, lastDotIndex);
      const fileExtension = fileName.substring(lastDotIndex).toLowerCase();
      
      // Validate registration ID format (basic validation)
      if (!registrationId || registrationId.length < 3) {
        errors.push(`Invalid registration ID: "${registrationId}" in file ${fileName}. Registration ID must be at least 3 characters.`);
        continue;
      }
      
      // Validate file extension
      const docConfig = DOCUMENT_TYPES[docType as keyof typeof DOCUMENT_TYPES];
      if (!docConfig.extensions.includes(fileExtension)) {
        errors.push(`Invalid file extension "${fileExtension}" for ${docType} document: ${fileName}. Allowed: ${docConfig.extensions.join(', ')}`);
        continue;
      }
      
      try {
        // Extract file content
        const fileData = await zipEntry.async('arraybuffer');
        const fileSize = fileData.byteLength;
        
        // Validate file size
        if (fileSize > docConfig.maxSize) {
          errors.push(`File too large: ${fileName} (${(fileSize / 1024 / 1024).toFixed(2)}MB). Max size for ${docType}: ${(docConfig.maxSize / 1024 / 1024)}MB`);
          continue;
        }
        
        // Create File object with appropriate MIME type
        const mimeType = getMimeTypeFromExtension(fileExtension);
        const blob = new Blob([fileData], { type: mimeType });
        const processedFile = new File([blob], fileName, {
          type: mimeType,
          lastModified: Date.now()
        });
        
        // Organize files by registration ID and document type
        if (!organizedFiles[registrationId]) {
          organizedFiles[registrationId] = {};
        }
        if (!organizedFiles[registrationId][docType]) {
          organizedFiles[registrationId][docType] = [];
        }
        
        organizedFiles[registrationId][docType].push(processedFile);
        
        // Update statistics
        documentTypeStats[docType] = (documentTypeStats[docType] || 0) + 1;
        totalFiles++;
        
        console.log(`✅ Processed: ${docType}/${registrationId} (${fileName})`);
        
      } catch (extractError) {
        errors.push(`Failed to extract file: ${fileName}. Error: ${extractError instanceof Error ? extractError.message : 'Unknown error'}`);
      }
    }
    
    // Generate comprehensive summary
    const studentCount = Object.keys(organizedFiles).length;
    const docTypesFound = Object.keys(documentTypeStats);
    
    let summary = `Processed ${totalFiles} files for ${studentCount} students across ${docTypesFound.length} document types.`;
    if (errors.length > 0) {
      summary += ` ${errors.length} errors found.`;
    }
    
    // Add document type breakdown
    const typeBreakdown = Object.entries(documentTypeStats)
      .map(([type, count]) => `${count} ${type}`)
      .join(', ');
    summary += ` Breakdown: ${typeBreakdown}.`;
    
    console.log('📊 ZIP Processing Results:', {
      totalFiles,
      studentCount,
      documentTypeStats,
      errorsCount: errors.length,
      studentsWithDocuments: Object.keys(organizedFiles).map(regId => ({
        registrationId: regId,
        documentTypes: Object.keys(organizedFiles[regId]),
        totalDocs: Object.values(organizedFiles[regId]).flat().length
      }))
    });
    
    return {
      success: errors.length === 0 || totalFiles > 0,
      totalFiles,
      organizedFiles,
      errors,
      summary,
      documentTypeStats
    };
    
  } catch (error) {
    console.error('❌ ZIP Processing Error:', error);
    throw new Error(`Failed to process ZIP file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Validates ZIP file registration IDs against existing students
 * @param organizedFiles The organized files from processZipFile
 * @param existingStudents The list of existing students in the database
 * @returns Validation results including valid and invalid registration IDs
 */
export const validateZipRegistrationIds = (
  organizedFiles: {[registrationId: string]: {[docType: string]: File[]}},
  existingStudents: Student[]
): {
  validRegistrationIds: string[];
  invalidRegistrationIds: string[];
  errors: string[];
  warnings: string[];
} => {
  console.log('🔍 validateZipRegistrationIds called with:', {
    zipRegistrationIds: Object.keys(organizedFiles).length,
    existingStudentsCount: existingStudents.length
  });

  const validRegistrationIds: string[] = [];
  const invalidRegistrationIds: string[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  // Get all existing registration IDs for quick lookup
  const existingRegIds = new Set(existingStudents.map(s => s.registrationId));

  // Check each registration ID from ZIP file
  Object.keys(organizedFiles).forEach(regId => {
    if (existingRegIds.has(regId)) {
      validRegistrationIds.push(regId);
      console.log(`✅ Valid registration ID: ${regId}`);
    } else {
      invalidRegistrationIds.push(regId);
      warnings.push(`Registration ID ${regId} not found in database - documents will be skipped`);
      console.log(`❌ Invalid registration ID: ${regId}`);
    }
  });

  console.log('🔍 ZIP validation results:', {
    valid: validRegistrationIds.length,
    invalid: invalidRegistrationIds.length,
    validIds: validRegistrationIds.slice(0, 5),
    invalidIds: invalidRegistrationIds.slice(0, 5)
  });

  return {
    validRegistrationIds,
    invalidRegistrationIds,
    errors,
    warnings
  };
};

// Helper function to get MIME type from file extension
function getMimeTypeFromExtension(extension: string): string {
  const mimeTypes: {[key: string]: string} = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg', 
    '.png': 'image/png',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };
  return mimeTypes[extension] || 'application/octet-stream';
}

/**
 * Validates a list of students against existing data to check for duplicates
 * @param newStudents The list of new students to validate
 * @param existingStudents The list of existing students in the database
 * @returns An object containing lists of valid students, duplicates, blocking errors, and duplicate warnings
 */
export const validateStudents = (
  newStudents: Student[], 
  existingStudents: Student[]
): { 
  validStudents: Student[],
  duplicates: Student[],
  errors: string[], // Blocking errors that prevent import
  duplicateWarnings: string[] // Non-blocking duplicate warnings
} => {
  console.log('🔍 validateStudents called with:', {
    newStudentsCount: newStudents.length,
    existingStudentsCount: existingStudents.length,
    firstNewStudent: newStudents[0],
    firstExistingStudent: existingStudents[0],
    newRegistrationIds: newStudents.slice(0, 3).map(s => s.registrationId),
    existingRegistrationIds: existingStudents.slice(0, 3).map(s => s.registrationId)
  });

  const errors: string[] = []; // Only blocking errors
  const duplicateWarnings: string[] = []; // Non-blocking duplicate info
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
      console.log(`🚨 Duplicate registration ID found: ${newStudent.registrationId}`, {
        newStudent: newStudent.fullName,
        existingStudent: duplicateRegistrationId.fullName
      });
      duplicates.push(newStudent);
      duplicateWarnings.push(`Registration ID ${newStudent.registrationId} already exists in the system`);
    } else if (duplicateCertificateId) {
      console.log(`🚨 Duplicate certificate ID found: ${newStudent.certificateId}`, {
        newStudent: newStudent.fullName,
        existingStudent: duplicateCertificateId.fullName
      });
      duplicates.push(newStudent);
      duplicateWarnings.push(`Certificate ID ${newStudent.certificateId} already exists in the system`);
    } else {
      validStudents.push(newStudent);
    }
  });
  
  console.log('🔍 Validation results:', {
    validCount: validStudents.length,
    duplicateCount: duplicates.length,
    errorsCount: errors.length,
    duplicateWarningsCount: duplicateWarnings.length
  });
  
  return { validStudents, duplicates, errors, duplicateWarnings };
};
