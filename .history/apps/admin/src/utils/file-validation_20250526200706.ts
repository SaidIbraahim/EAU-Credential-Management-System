import { FILE_TYPES } from '@/mock/fileTypes';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

export interface FileValidationError {
  message: string;
  code: 'FILE_TOO_LARGE' | 'INVALID_FILE_TYPE' | 'INVALID_FILE';
}

export interface FileValidationResult {
  isValid: boolean;
  error?: FileValidationError;
}

export function validateFile(
  file: File,
  documentType: keyof typeof FILE_TYPES
): FileValidationResult {
  // Check if file exists
  if (!file) {
    return {
      isValid: false,
      error: {
        code: 'INVALID_FILE',
        message: 'No file provided'
      }
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: {
        code: 'FILE_TOO_LARGE',
        message: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`
      }
    };
  }

  // Check file type
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  const allowedExtensions = FILE_TYPES[documentType].extensions;
  
  if (!allowedExtensions.includes(fileExtension)) {
    return {
      isValid: false,
      error: {
        code: 'INVALID_FILE_TYPE',
        message: `Invalid file type. Allowed types: ${FILE_TYPES[documentType].displayText}`
      }
    };
  }

  return { isValid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileTypeFromExtension(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return 'image';
    case 'pdf':
      return 'pdf';
    case 'doc':
    case 'docx':
      return 'word';
    case 'xls':
    case 'xlsx':
      return 'excel';
    default:
      return 'unknown';
  }
} 