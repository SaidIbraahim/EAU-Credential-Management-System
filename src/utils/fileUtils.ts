
import Papa from 'papaparse';
import { Student } from '@/types';

export const parseCSV = (file: File): Promise<Student[]> => {
  return new Promise((resolve, reject) => {
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
          
          // Validate required columns exist
          const firstRow = results.data[0] as any;
          const requiredColumns = ['Student ID', 'Full Name', 'Department'];
          const missingColumns = requiredColumns.filter(col => !(col in firstRow));
          
          if (missingColumns.length > 0) {
            reject(new Error(`CSV is missing required columns: ${missingColumns.join(', ')}`));
            return;
          }
          
          const students = results.data.map((row: any, index: number) => {
            // Convert CSV data to Student type with additional validation
            return {
              id: index + 1, // Temporary ID until saved to database
              student_id: row['Student ID'] || '',
              certificate_id: row['Certificate ID'] || '',
              full_name: row['Full Name'] || '',
              gender: (row['Gender']?.toLowerCase() === 'male' ? 'male' : 'female') as 'male' | 'female',
              phone_number: row['Phone Number'] || '',
              department: row['Department'] || '',
              academic_year: row['Academic Year'] || '',
              gpa: parseFloat(row['GPA']) || 0,
              grade: row['Grade'] || '',
              admission_date: row['Admission Date'] ? new Date(row['Admission Date']) : new Date(),
              graduation_date: row['Graduation Date'] ? new Date(row['Graduation Date']) : undefined,
              status: (row['Status']?.toLowerCase() === 'cleared' ? 'cleared' : 'uncleared') as 'cleared' | 'uncleared',
              created_at: new Date(),
              updated_at: new Date(),
            };
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

export const processZipFile = async (file: File): Promise<string> => {
  // In a real implementation, this would extract the ZIP and process each file
  try {
    // Validate zip file size
    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      throw new Error("ZIP file is too large. Maximum allowed size is 100MB.");
    }
    
    // Validate file type
    if (!file.type.includes('zip')) {
      throw new Error("File must be a ZIP archive.");
    }
    
    // Return basic information for now
    return `Processed ZIP file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
  } catch (error) {
    throw error;
  }
};
