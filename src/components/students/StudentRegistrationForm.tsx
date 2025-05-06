
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Save, X } from "lucide-react";
import { toast } from "sonner";

import { studentsApi, documentsApi, auditLogApi } from "@/api/apiClient";
import { Student } from "@/types";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

import PersonalInfoForm from "./PersonalInfoForm";
import AcademicInfoForm from "./AcademicInfoForm";
import DocumentsSection from "./DocumentsSection";
import { formSchema, FormValues } from "./formSchema";
import { DEPARTMENTS, ACADEMIC_YEARS, FACULTIES } from "@/mock/academicData";

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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      registration_no: "",
      certificate_id: "",
      gender: "male",
      phone_number: "",
      faculty_id: "",
      department_id: "",
      academic_year_id: "",
      grade: "",
      status: "un-cleared",
    }
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      try {
        const existingStudents = await studentsApi.getAll();
        
        // Check for duplicate registration number
        const isDuplicateRegistrationNo = existingStudents.data.some(
          student => student.student_id === values.registration_no
        );
        
        if (isDuplicateRegistrationNo) {
          setError(`Registration Number "${values.registration_no}" already exists.`);
          setIsSubmitting(false);
          return;
        }
        
        // Check for duplicate certificate ID if provided
        if (values.certificate_id) {
          const isDuplicateCertificateId = existingStudents.data.some(
            student => student.certificate_id === values.certificate_id
          );
          
          if (isDuplicateCertificateId) {
            setError(`Certificate Serial No "${values.certificate_id}" already exists.`);
            setIsSubmitting(false);
            return;
          }
        }
      } catch (error) {
        console.error("Error checking for duplicates:", error);
      }
      
      const facultyName = values.faculty_id 
        ? FACULTIES.find(f => f.id.toString() === values.faculty_id)?.name 
        : undefined;
        
      const studentData: Omit<Student, 'id' | 'created_at' | 'updated_at'> = {
        student_id: values.registration_no,
        certificate_id: values.certificate_id || undefined,
        full_name: values.full_name,
        gender: values.gender,
        phone_number: values.phone_number || undefined,
        faculty: facultyName,
        department: DEPARTMENTS.find(d => d.id.toString() === values.department_id)?.name || "",
        academic_year: ACADEMIC_YEARS.find(y => y.id.toString() === values.academic_year_id)?.academic_year || "",
        gpa: values.gpa || 0,
        grade: values.grade || "",
        graduation_date: values.graduation_date,
        status: values.status,
      };
      
      const createdStudent = await studentsApi.create(studentData);
      
      const allFiles = [
        ...files.photo.map(file => ({ file, type: 'photo' as const })),
        ...files.transcript.map(file => ({ file, type: 'transcript' as const })),
        ...files.certificate.map(file => ({ file, type: 'certificate' as const })),
        ...files.supporting.map(file => ({ file, type: 'supporting' as const }))
      ];
      
      if (allFiles.length > 0) {
        try {
          for (const { file, type } of allFiles) {
            await documentsApi.upload(createdStudent.id.toString(), [file], type);
          }
          
          await auditLogApi.logAction(
            "Documents Uploaded", 
            `Uploaded ${allFiles.length} documents for student ${studentData.full_name} (ID: ${studentData.student_id})`
          );
        } catch (error) {
          console.error("Error uploading documents:", error);
          toast.error("Student was created but there was an error uploading documents.");
        }
      }
      
      await auditLogApi.logAction(
        "Student Added", 
        `Added student ${studentData.full_name} with ID ${studentData.student_id}`
      );
      
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
    } catch (error) {
      console.error("Registration error:", error);
      setError(error instanceof Error ? error.message : "Failed to register student");
      toast.error("Failed to register student");
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

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PersonalInfoForm control={form.control} />
            <AcademicInfoForm 
              control={form.control} 
              departments={DEPARTMENTS}
              academicYears={ACADEMIC_YEARS}
            />
          </div>
          
          <DocumentsSection files={files} setFiles={setFiles} />
          
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary-500 hover:bg-primary-600 text-white"
              disabled={isSubmitting}
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
                  Register Student
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
