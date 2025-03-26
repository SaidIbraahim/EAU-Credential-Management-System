
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { 
  CalendarIcon, 
  Upload, 
  Save, 
  XCircle,
  AlertCircle 
} from "lucide-react";
import { toast } from "sonner";

import { studentsApi, documentsApi, auditLogApi } from "@/api/apiClient";
import { Student } from "@/types";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  RadioGroup, 
  RadioGroupItem 
} from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const DEPARTMENTS = [
  { id: 1, name: "Computer Science", code: "CS" },
  { id: 2, name: "Medicine", code: "MED" },
  { id: 3, name: "Engineering", code: "ENG" },
  { id: 4, name: "Business", code: "BUS" },
  { id: 5, name: "Law", code: "LAW" }
];

const ACADEMIC_YEARS = [
  { id: 1, academic_year: "2020-2021" },
  { id: 2, academic_year: "2021-2022" },
  { id: 3, academic_year: "2022-2023" },
  { id: 4, academic_year: "2023-2024" },
  { id: 5, academic_year: "2024-2025" }
];

const formSchema = z.object({
  full_name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  student_id: z.string()
    .min(8, { message: "Student ID must be at least 8 characters" })
    .refine(id => /^[A-Za-z0-9-]+$/.test(id), {
      message: "Student ID can only contain letters, numbers, and hyphens"
    }),
  certificate_id: z.string().optional(),
  gender: z.enum(["male", "female"]),
  phone_number: z.string().optional(),
  department_id: z.string(),
  academic_year_id: z.string(),
  gpa: z.coerce.number()
    .min(0, { message: "GPA must be at least 0" })
    .max(4.0, { message: "GPA must be no more than 4.0" })
    .step(0.01, { message: "GPA can have up to 2 decimal places" }),
  grade: z.string().optional(),
  admission_date: z.date({
    required_error: "Admission date is required",
  }),
  graduation_date: z.date().optional(),
  status: z.enum(["cleared", "un-cleared"]),
});

type FormValues = z.infer<typeof formSchema>;

interface StudentRegistrationFormProps {
  onSuccess?: () => void;
}

const StudentRegistrationForm = ({ onSuccess }: StudentRegistrationFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<{ [key: string]: File[] }>({
    photo: [],
    transcript: [],
    certificate: [],
    supporting: []
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      student_id: "",
      certificate_id: "",
      gender: "male",
      phone_number: "",
      department_id: "",
      academic_year_id: "",
      gpa: "0",
      grade: "",
      status: "un-cleared",
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'transcript' | 'certificate' | 'supporting') => {
    if (e.target.files && e.target.files.length > 0) {
      const fileList = Array.from(e.target.files);
      setFiles(prev => ({
        ...prev,
        [type]: [...prev[type], ...fileList]
      }));
    }
  };

  const removeFile = (type: 'photo' | 'transcript' | 'certificate' | 'supporting', index: number) => {
    setFiles(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Check if student ID already exists
      try {
        const existingStudents = await studentsApi.getAll();
        const isDuplicate = existingStudents.data.some(
          student => student.student_id === values.student_id
        );
        
        if (isDuplicate) {
          setError(`Student ID "${values.student_id}" already exists.`);
          setIsSubmitting(false);
          return;
        }
      } catch (error) {
        console.error("Error checking for duplicate student IDs:", error);
      }
      
      // Format the data for API submission
      const studentData: Omit<Student, 'id' | 'created_at' | 'updated_at'> = {
        student_id: values.student_id,
        certificate_id: values.certificate_id || undefined,
        full_name: values.full_name,
        gender: values.gender,
        phone_number: values.phone_number || undefined,
        department: DEPARTMENTS.find(d => d.id.toString() === values.department_id)?.name || "",
        academic_year: ACADEMIC_YEARS.find(y => y.id.toString() === values.academic_year_id)?.academic_year || "",
        gpa: values.gpa,
        grade: values.grade || "",
        admission_date: values.admission_date,
        graduation_date: values.graduation_date,
        status: values.status,
      };
      
      // Create student
      const createdStudent = await studentsApi.create(studentData);
      
      // Upload documents if any
      const allFiles = [
        ...files.photo.map(file => ({ file, type: 'photo' as const })),
        ...files.transcript.map(file => ({ file, type: 'transcript' as const })),
        ...files.certificate.map(file => ({ file, type: 'certificate' as const })),
        ...files.supporting.map(file => ({ file, type: 'supporting' as const }))
      ];
      
      if (allFiles.length > 0) {
        try {
          await documentsApi.upload(createdStudent.id.toString(), allFiles.map(f => f.file));
          
          // Add document info to audit log
          await auditLogApi.logAction(
            "Documents Uploaded", 
            `Uploaded ${allFiles.length} documents for student ${studentData.full_name} (ID: ${studentData.student_id})`
          );
        } catch (error) {
          console.error("Error uploading documents:", error);
          toast.error("Student was created but there was an error uploading documents.");
        }
      }
      
      // Add to audit log
      await auditLogApi.logAction(
        "Student Added", 
        `Added student ${studentData.full_name} with ID ${studentData.student_id}`
      );
      
      toast.success("Student registered successfully!");
      
      // Reset form
      form.reset();
      setFiles({
        photo: [],
        transcript: [],
        certificate: [],
        supporting: []
      });
      
      // Call success callback
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
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="student_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student ID *</FormLabel>
                  <FormControl>
                    <Input placeholder="EAUGRW0001234" {...field} />
                  </FormControl>
                  <FormDescription>
                    Unique identifier for the student
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="certificate_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Certificate ID</FormLabel>
                  <FormControl>
                    <Input placeholder="CERT2023123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Gender *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="male" id="male" />
                        <label htmlFor="male">Male</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="female" id="female" />
                        <label htmlFor="female">Female</label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+1234567890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="department_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department *</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem 
                          key={dept.id} 
                          value={dept.id.toString()}
                        >
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="academic_year_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Academic Year *</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select academic year" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ACADEMIC_YEARS.map((year) => (
                        <SelectItem 
                          key={year.id} 
                          value={year.id.toString()}
                        >
                          {year.academic_year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="gpa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GPA *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="3.5" 
                      {...field} 
                      step="0.01"
                      min="0"
                      max="4.0"
                    />
                  </FormControl>
                  <FormDescription>
                    Value between 0.0 and 4.0
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="grade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grade</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                      <SelectItem value="D">D</SelectItem>
                      <SelectItem value="F">F</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="admission_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Admission Date *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="graduation_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Graduation Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cleared">Cleared</SelectItem>
                      <SelectItem value="un-cleared">Un-cleared</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Documents</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium mb-2">Student Photo</p>
                <div className="border border-dashed border-gray-300 rounded-lg p-4">
                  <label className="flex flex-col items-center justify-center cursor-pointer">
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Click to upload photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, 'photo')}
                    />
                  </label>
                  
                  {files.photo.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {files.photo.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm truncate max-w-[180px]">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile('photo', index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Transcript</p>
                <div className="border border-dashed border-gray-300 rounded-lg p-4">
                  <label className="flex flex-col items-center justify-center cursor-pointer">
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Click to upload transcript</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, 'transcript')}
                    />
                  </label>
                  
                  {files.transcript.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {files.transcript.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm truncate max-w-[180px]">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile('transcript', index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Certificate</p>
                <div className="border border-dashed border-gray-300 rounded-lg p-4">
                  <label className="flex flex-col items-center justify-center cursor-pointer">
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Click to upload certificate</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, 'certificate')}
                    />
                  </label>
                  
                  {files.certificate.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {files.certificate.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm truncate max-w-[180px]">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile('certificate', index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Supporting Documents</p>
                <div className="border border-dashed border-gray-300 rounded-lg p-4">
                  <label className="flex flex-col items-center justify-center cursor-pointer">
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Click to upload documents</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className="hidden"
                      multiple
                      onChange={(e) => handleFileChange(e, 'supporting')}
                    />
                  </label>
                  
                  {files.supporting.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {files.supporting.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm truncate max-w-[180px]">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile('supporting', index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
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
