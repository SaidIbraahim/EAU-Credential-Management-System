import * as z from "zod";

export const formSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  registrationId: z.string()
    .regex(/^GRW-[A-Z]{3}-\d{4}$/, "Registration number should be in format GRW-XXX-YYYY (e.g. GRW-BCS-2005)"),
  certificateId: z.string()
    .regex(/^\d{4}$/, "Certificate ID must be exactly 4 digits")
    .optional()
    .or(z.literal("")), // Allow empty string
  gender: z.enum(['MALE', 'FEMALE'], {
    required_error: "Gender is required"
  }),
  phone: z.string().optional(),
  graduationDate: z.date().optional(),
  departmentId: z.number({
    required_error: "Department is required",
  }),
  facultyId: z.number({
    required_error: "Faculty is required",
  }),
  academicYearId: z.number({
    required_error: "Academic year is required",
  }),
  gpa: z.number({
    required_error: "GPA is required"
  })
    .min(0, "GPA must be between 0 and 4")
    .max(4, "GPA must be between 0 and 4"),
  grade: z.string().min(1, "Grade is required"),
  status: z.enum(['CLEARED', 'UN_CLEARED'], {
    required_error: "Status is required"
  })
});

export type FormValues = z.infer<typeof formSchema>;
