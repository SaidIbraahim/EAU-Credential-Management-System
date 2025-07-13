import { useState, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';

interface RegistrationData {
  registrationId: string;
  certificateId?: string;
  fullName: string;
  gender?: string;
  phone?: string;
  departmentId: number;
  facultyId: number;
  academicYearId: number;
  gpa?: number;
  grade?: string;
  graduationDate?: string;
}

interface DocumentFile {
  file: File;
  type: string;
  title: string;
}

interface RegistrationProgress {
  step: 'validation' | 'student' | 'documents' | 'completed';
  percentage: number;
  message: string;
  currentFile?: string;
  filesUploaded?: number;
  totalFiles?: number;
}

interface ValidationError {
  field: string;
  message: string;
}

interface UseOptimizedRegistrationReturn {
  isLoading: boolean;
  progress: RegistrationProgress;
  error: string | null;
  validationErrors: ValidationError[];
  registerStudent: (data: RegistrationData, files: DocumentFile[]) => Promise<boolean>;
  resetRegistration: () => void;
  validateData: (data: RegistrationData) => Promise<boolean>;
  preValidateFiles: (files: DocumentFile[]) => ValidationError[];
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const REQUIRED_DOCUMENT_TYPES = ['photo', 'transcript', 'certificate'];
const BATCH_SIZE = 3; // Upload 3 files at a time for optimal performance

export const useOptimizedRegistration = (): UseOptimizedRegistrationReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<RegistrationProgress>({
    step: 'validation',
    percentage: 0,
    message: 'Ready to register'
  });
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * 🔍 Pre-validate files before submission for immediate feedback
   */
  const preValidateFiles = useCallback((files: DocumentFile[]): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Check if all required document types are present
    const providedTypes = files.map(f => f.type.toLowerCase());
    const missingTypes = REQUIRED_DOCUMENT_TYPES.filter(type => 
      !providedTypes.includes(type)
    );

    if (missingTypes.length > 0) {
      errors.push({
        field: 'documents',
        message: `Missing required documents: ${missingTypes.join(', ')}`
      });
    }

    // Validate each file
    files.forEach((fileData, index) => {
      const { file, type, title } = fileData;

      // File size validation
      if (file.size > MAX_FILE_SIZE) {
        errors.push({
          field: `file_${index}`,
          message: `${title} exceeds maximum size of 10MB`
        });
      }

      // File type validation
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        errors.push({
          field: `file_${index}`,
          message: `${title} has invalid file type. Allowed: JPG, PNG, PDF`
        });
      }

      // Title validation
      if (!title.trim()) {
        errors.push({
          field: `title_${index}`,
          message: `Document title is required`
        });
      }
    });

    // Check for duplicate document types
    const typeCount = providedTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(typeCount).forEach(([type, count]) => {
      if (count > 1) {
        errors.push({
          field: 'documents',
          message: `Duplicate document type: ${type}`
        });
      }
    });

    return errors;
  }, []);

  /**
   * ✅ Validate registration data
   */
  const validateData = useCallback(async (data: RegistrationData): Promise<boolean> => {
    const errors: ValidationError[] = [];
    
    // Required field validation
    if (!data.registrationId?.trim()) {
      errors.push({ field: 'registrationId', message: 'Registration ID is required' });
    }
    
    if (!data.fullName?.trim()) {
      errors.push({ field: 'fullName', message: 'Full name is required' });
    }
    
    if (!data.departmentId) {
      errors.push({ field: 'departmentId', message: 'Department is required' });
    }
    
    if (!data.facultyId) {
      errors.push({ field: 'facultyId', message: 'Faculty is required' });
    }
    
    if (!data.academicYearId) {
      errors.push({ field: 'academicYearId', message: 'Academic year is required' });
    }

    // Format validation
    if (data.registrationId && !/^[A-Za-z0-9-/]+$/.test(data.registrationId)) {
      errors.push({ 
        field: 'registrationId', 
        message: 'Registration ID contains invalid characters' 
      });
    }

    if (data.phone && !/^\+?[\d\s-()]+$/.test(data.phone)) {
      errors.push({ 
        field: 'phone', 
        message: 'Invalid phone number format' 
      });
    }

    if (data.gpa && (data.gpa < 0 || data.gpa > 4.0)) {
      errors.push({ 
        field: 'gpa', 
        message: 'GPA must be between 0.0 and 4.0' 
      });
    }

    // Server-side uniqueness validation
    try {
      const response = await fetch('/api/students/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: data.registrationId,
          certificateId: data.certificateId
        })
      });

      if (!response.ok) {
        const result = await response.json();
        if (result.errors) {
          errors.push(...result.errors);
        }
      }
    } catch (error) {
      console.warn('Could not validate with server:', error);
    }

    setValidationErrors(errors);
    return errors.length === 0;
  }, []);

  /**
   * 📁 Upload files in optimized batches
   */
  const uploadFilesBatch = async (
    files: DocumentFile[], 
    studentId: number,
    signal: AbortSignal
  ): Promise<void> => {
    const totalFiles = files.length;
    let uploadedCount = 0;

    // Process files in batches for optimal performance
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      if (signal.aborted) throw new Error('Upload cancelled');

      const batch = files.slice(i, i + BATCH_SIZE);
      
      // Upload batch in parallel
      const batchPromises = batch.map(async (fileData, batchIndex) => {
        const globalIndex = i + batchIndex;
        const { file, type, title } = fileData;

        setProgress(prev => ({
          ...prev,
          percentage: 20 + ((globalIndex / totalFiles) * 70), // 20-90% for uploads
          message: `Uploading ${title}...`,
          currentFile: title,
          filesUploaded: uploadedCount,
          totalFiles
        }));

        const formData = new FormData();
        formData.append('registrationId', studentId.toString());
        formData.append('documentType', type);
        formData.append('title', title);
        formData.append('file', file);

        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
          signal
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`Failed to upload ${title}: ${error.message}`);
        }

        uploadedCount++;
        return response.json();
      });

      try {
        await Promise.all(batchPromises);
        console.log(`✅ Batch ${Math.floor(i / BATCH_SIZE) + 1} uploaded successfully`);
      } catch (error) {
        console.error(`❌ Batch upload failed:`, error);
        throw error;
      }
    }
  };

  /**
   * 🚀 Main registration function with optimized performance
   */
  const registerStudent = useCallback(async (
    data: RegistrationData, 
    files: DocumentFile[]
  ): Promise<boolean> => {
    // Reset state
    setError(null);
    setValidationErrors([]);
    setIsLoading(true);
    
    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    try {
      // 🔍 STEP 1: Pre-validation (0-10%)
      setProgress({
        step: 'validation',
        percentage: 5,
        message: 'Validating registration data...'
      });

      const fileValidationErrors = preValidateFiles(files);
      if (fileValidationErrors.length > 0) {
        setValidationErrors(fileValidationErrors);
        throw new Error('File validation failed');
      }

      const dataValid = await validateData(data);
      if (!dataValid) {
        throw new Error('Data validation failed');
      }

      // 👤 STEP 2: Create student record (10-20%)
      setProgress({
        step: 'student',
        percentage: 10,
        message: 'Creating student record...'
      });

      console.time('⚡ Student Creation');
      const studentResponse = await fetch('/api/students/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal
      });

      if (!studentResponse.ok) {
        const errorData = await studentResponse.json();
        throw new Error(errorData.message || 'Failed to create student record');
      }

      const studentResult = await studentResponse.json();
      const studentId = studentResult.student.id;
      console.timeEnd('⚡ Student Creation');

      // 📄 STEP 3: Upload documents in batches (20-90%)
      setProgress({
        step: 'documents',
        percentage: 20,
        message: 'Preparing document upload...',
        filesUploaded: 0,
        totalFiles: files.length
      });

      console.time('⚡ Document Upload');
      await uploadFilesBatch(files, studentId, signal);
      console.timeEnd('⚡ Document Upload');

      // ✅ STEP 4: Completion (90-100%)
      setProgress({
        step: 'completed',
        percentage: 100,
        message: 'Registration completed successfully!'
      });

      toast.success('🎉 Student registered successfully!');
      return true;

    } catch (error: any) {
      console.error('❌ Registration failed:', error);
      
      if (error.name === 'AbortError') {
        setError('Registration was cancelled');
        toast.warning('Registration cancelled');
      } else {
        const errorMessage = error.message || 'Registration failed';
        setError(errorMessage);
        toast.error(`Registration failed: ${errorMessage}`);
      }
      
      return false;
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [validateData, preValidateFiles]);

  /**
   * 🔄 Reset registration state
   */
  const resetRegistration = useCallback(() => {
    // Cancel any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsLoading(false);
    setError(null);
    setValidationErrors([]);
    setProgress({
      step: 'validation',
      percentage: 0,
      message: 'Ready to register'
    });
  }, []);

  return {
    isLoading,
    progress,
    error,
    validationErrors,
    registerStudent,
    resetRegistration,
    validateData,
    preValidateFiles
  };
}; 