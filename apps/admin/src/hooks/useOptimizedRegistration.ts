import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { studentsApi, documentsApi, auditLogApi } from '@/api/apiClient';
import { Student } from '@/types';

interface RegistrationState {
  isSubmitting: boolean;
  uploadProgress: { [key: string]: number };
  errors: string[];
}

export const useOptimizedRegistration = () => {
  const [state, setState] = useState<RegistrationState>({
    isSubmitting: false,
    uploadProgress: {},
    errors: []
  });

  // ⚡ Pre-validate data before submission
  const preValidateStudent = useCallback((studentData: any) => {
    const errors: string[] = [];
    
    if (!studentData.registrationId?.match(/^GRW-[A-Z]{3}-\d{4}$/)) {
      errors.push('Invalid registration ID format');
    }
    
    if (!studentData.fullName?.trim()) {
      errors.push('Full name is required');
    }
    
    if (!studentData.departmentId || !studentData.facultyId || !studentData.academicYearId) {
      errors.push('Academic information is incomplete');
    }
    
    return errors;
  }, []);

  // ⚡ Optimized file preparation
  const prepareFilesForUpload = useCallback((files: any) => {
    const fileGroups = {
      photo: files.photo || [],
      transcript: files.transcript || [],
      certificate: files.certificate || [],
      supporting: files.supporting || []
    };

    // Pre-validate file sizes and types
    const validationErrors: string[] = [];
    Object.entries(fileGroups).forEach(([type, fileList]: [string, any[]]) => {
      fileList.forEach(file => {
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          validationErrors.push(`${file.name} is too large (max 10MB)`);
        }
      });
    });

    return { fileGroups, validationErrors };
  }, []);

  // ⚡ Ultra-fast registration with parallel processing
  const registerStudent = useCallback(async (studentData: any, files: any) => {
    console.time('🚀 Complete Registration Process');
    
    try {
      setState(prev => ({ ...prev, isSubmitting: true, errors: [] }));

      // Step 1: Pre-validate everything
      const validationErrors = preValidateStudent(studentData);
      const { fileGroups, validationErrors: fileErrors } = prepareFilesForUpload(files);
      
      const allErrors = [...validationErrors, ...fileErrors];
      if (allErrors.length > 0) {
        setState(prev => ({ ...prev, errors: allErrors, isSubmitting: false }));
        return { success: false, errors: allErrors };
      }

      // Step 2: Create student record (optimized)
      console.time('📝 Student Creation');
      const createdStudent = await studentsApi.create({
        ...studentData,
        graduationDate: studentData.graduationDate?.toISOString()
      });
      console.timeEnd('📝 Student Creation');

      // Step 3: Upload documents in parallel batches
      const allFiles = Object.entries(fileGroups).flatMap(([type, fileList]: [string, any[]]) =>
        fileList.map(file => ({ file, type }))
      );

      if (allFiles.length > 0) {
        console.time('📤 Parallel Document Upload');
        
        // Upload in batches of 3 for optimal performance
        const BATCH_SIZE = 3;
        const batches = [];
        for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
          batches.push(allFiles.slice(i, i + BATCH_SIZE));
        }

        let completedFiles = 0;
        for (const batch of batches) {
          const batchPromises = batch.map(async ({ file, type }) => {
            const formData = new FormData();
            formData.append('files', file);
            
            try {
              const result = await documentsApi.upload(createdStudent.registrationId, type, formData);
              completedFiles++;
              setState(prev => ({
                ...prev,
                uploadProgress: {
                  ...prev.uploadProgress,
                  [file.name]: (completedFiles / allFiles.length) * 100
                }
              }));
              return result;
            } catch (error) {
              console.error(`Upload failed for ${file.name}:`, error);
              throw error;
            }
          });

          await Promise.all(batchPromises);
        }
        
        console.timeEnd('📤 Parallel Document Upload');
      }

      // Step 4: Log audit entry (non-blocking)
      auditLogApi.logAction(
        "Student Registration", 
        `Registered student '${studentData.fullName}' with ID '${studentData.registrationId}'`
      ).catch(err => console.warn('Audit log failed:', err));

      console.timeEnd('🚀 Complete Registration Process');
      
      toast.success(`Student registered successfully in optimized time!`);
      
      setState(prev => ({ 
        ...prev, 
        isSubmitting: false, 
        uploadProgress: {},
        errors: [] 
      }));
      
      return { success: true, student: createdStudent };

    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.error || 'Registration failed';
      
      setState(prev => ({ 
        ...prev, 
        isSubmitting: false, 
        errors: [errorMessage] 
      }));
      
      toast.error(errorMessage);
      return { success: false, errors: [errorMessage] };
    }
  }, [preValidateStudent, prepareFilesForUpload]);

  return {
    ...state,
    registerStudent,
    resetState: () => setState({
      isSubmitting: false,
      uploadProgress: {},
      errors: []
    })
  };
}; 