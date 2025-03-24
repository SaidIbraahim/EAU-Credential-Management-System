
import Papa from 'papaparse';
import { Student } from '@/types';

export const parseCSV = (file: File): Promise<Student[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const students = results.data.map((row: any, index: number) => {
            // Convert CSV data to Student type
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
  // For now, we'll just return a message
  return `Processed ZIP file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
};
