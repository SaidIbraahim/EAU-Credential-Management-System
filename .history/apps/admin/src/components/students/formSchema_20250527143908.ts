import * as z from "zod";

export const formSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  registrationId: z.string()
    .regex(/^GRW-[A-Z]{3}-\d{4}$/, "Registration number should be in format GRW-XXX-YYYY (e.g. GRW-BCS-2005)"),
  certificateId: z.string()
    .regex(/^\d{4}$/, "Certificate ID must be exactly 4 digits")
    .optional(),
  email: z.string().email("Invalid email address").optional(),
  studentId: z.string().min(3, "Student ID is required"),
  enrollmentDate: z.date({
    required_error: "Enrollment date is required",
  }),
  graduationDate: z.date().optional(),
  program: z.string({
    required_error: "Program is required",
  }),
  departmentId: z.number({
    required_error: "Department is required",
  }),
  facultyId: z.number({
    required_error: "Faculty is required",
  }),
  academicYearId: z.number({
    required_error: "Academic year is required",
  }),
  gpa: z.number()
    .min(0, "GPA must be between 0 and 4")
    .max(4, "GPA must be between 0 and 4")
    .optional(),
  grade: z.string().optional(),
  status: z.enum(['ACTIVE', 'GRADUATED', 'WITHDRAWN']).default('ACTIVE')
});

export type FormValues = z.infer<typeof formSchema>;
