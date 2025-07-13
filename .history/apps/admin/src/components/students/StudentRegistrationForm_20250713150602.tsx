import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Save, X } from "lucide-react";
import { toast } from "sonner";

import { studentsApi, documentsApi, auditLogApi, facultiesApi, departmentsApi, academicYearsApi } from "@/api/apiClient";
import { Student } from "@/types";
import { useOptimizedData } from "@/hooks/useOptimizedData";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

import PersonalInfoForm from "./PersonalInfoForm";
import AcademicInfoForm from "./AcademicInfoForm";
import DocumentsSection from "./DocumentsSection";
import { formSchema, FormValues } from "./formSchema";

export type { FormValues };

interface StudentRegistrationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const StudentRegistrationForm = ({ onSuccess, onCancel }: StudentRegistrationFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<{
    photo: File[];
    transcript: File[];
    certificate: File[];
    supporting: File[];
  }>({
    photo: [],
    transcript: [],
    certificate: [],
    supporting: []
  });

  // Optimized data fetching for academic data
  const {
    data: faculties,
    isLoading: facultiesLoading
  } = useOptimizedData(
    () => facultiesApi.getAll(),
    { cacheKey: 'faculties', cacheExpiry: 10 * 60 * 1000 }
  );

  const {
    data: departments,
    isLoading: departmentsLoading
  } = useOptimizedData(
    () => departmentsApi.getAll(),
    { cacheKey: 'departments', cacheExpiry: 10 * 60 * 1000 }
  );

  const {
    data: academicYears,
    isLoading: academicYearsLoading
  } = useOptimizedData(
    () => academicYearsApi.getAll(),
    { cacheKey: 'academic-years', cacheExpiry: 10 * 60 * 1000 }
  );

  const isAcademicDataLoading = facultiesLoading || departmentsLoading || academicYearsLoading;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      registrationId: "",
      certificateId: "",
      gender: undefined,
      phone: "",
      graduationDate: undefined,
      departmentId: undefined,
      facultyId: undefined,
      academicYearId: undefined,
      gpa: undefined,
      grade: "",
      status: "UN_CLEARED",
    }
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Create student with fields that match backend schema
      const studentData = {
        fullName: values.fullName,
        registrationId: values.registrationId,
        certificateId: values.certificateId || undefined,
        gender: values.gender,
        phone: values.phone || undefined,
        graduationDate: values.graduationDate?.toISOString(),
        departmentId: values.departmentId,
        facultyId: values.facultyId,
        academicYearId: values.academicYearId,
        gpa: values.gpa,
        grade: values.grade,
        status: values.status
      };
      
      const createdStudent = await studentsApi.create(studentData);
      
      // ⚡ FIXED: Upload documents using BATCH processing for maximum performance
      const documentTypes = ['photo', 'transcript', 'certificate', 'supporting'] as const;
      
      if (Object.values(files).some(fileArray => fileArray.length > 0)) {
        try {
          console.time('⚡ Document Upload Performance');
          
          // Process each document type that has files using batch upload
          const uploadPromises = documentTypes
            .filter(type => files[type].length > 0)
            .map(async (type) => {
              const formData = new FormData();
              
              // Add all files of this type to the same FormData
              files[type].forEach(file => {
                formData.append('files', file);
              });
              
              console.log(`📤 Batch uploading ${files[type].length} ${type} files for ${createdStudent.registrationId}`);
              
              // Send all files of this type in one batch request
              return documentsApi.upload(createdStudent.registrationId, type, formData);
            });
          
          // Execute all document type uploads in parallel
          await Promise.all(uploadPromises);
          
          console.timeEnd('⚡ Document Upload Performance');
          
          const totalFiles = Object.values(files).reduce((sum, fileArray) => sum + fileArray.length, 0);
          console.log(`🚀 Successfully uploaded ${totalFiles} documents using optimized batch processing!`);
        } catch (error) {
          console.error("Error uploading documents:", error);
          toast.error("Student was created but there was an error uploading documents");
        }
      }
      
      toast.success("Student registered successfully!");
      form.reset();
      setFiles({
        photo: [],
        transcript: [],
        certificate: [],
        supporting: []
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      setError(error.response?.data?.error || "Failed to register student");
      toast.error(error.response?.data?.error || "Failed to register student");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      form.reset();
      setFiles({
        photo: [],
        transcript: [],
        certificate: [],
        supporting: []
      });
    }
  };

  // Remove the blocking loading state - show form with skeleton loading instead
  // if (isAcademicDataLoading) {
  //   return (
  //     <div className="space-y-6 p-6">
  //       <div className="flex items-center justify-center">
  //         <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mr-3"></div>
  //         <p className="text-gray-500">Loading academic configuration...</p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal and Academic Information */}
          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <h2 className="text-lg font-medium text-gray-900">Student Information</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PersonalInfoForm control={form.control} />
              <AcademicInfoForm 
                control={form.control}
                faculties={faculties || []}
                departments={departments || []}
                academicYears={academicYears || []}
                isLoading={isAcademicDataLoading}
              />
            </div>
          </div>
          
          {/* Documents Section */}
          <div className="bg-white border rounded-lg p-6">
            <DocumentsSection files={files} setFiles={setFiles} />
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-6"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary-500 hover:bg-primary-600 text-white px-6"
              disabled={isSubmitting || isAcademicDataLoading}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center">
                  <Save className="mr-2 h-4 w-4" />
                  {isAcademicDataLoading ? 'Loading...' : 'Register Student'}
                </span>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default StudentRegistrationForm;
