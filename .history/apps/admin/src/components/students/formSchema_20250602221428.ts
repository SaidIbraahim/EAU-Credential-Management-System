import * as z from "zod";

export const formSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  registrationId: z.string()
    .regex(/^GRW-[A-Z]{3}-\d{4}$/, "Registration number should be in format GRW-XXX-YYYY (e.g. GRW-BCS-2005)"),
  certificateId: z.string()
    .regex(/^\d{4}$/, "Certificate ID must be exactly 4 digits")
    .optional(),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
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
  gpa: z.number()
    .min(0, "GPA must be between 0 and 4")
    .max(4, "GPA must be between 0 and 4")
    .optional(),
  grade: z.string().optional(),
  status: z.enum(['CLEARED', 'UN_CLEARED']).default('UN_CLEARED')
});

export type FormValues = z.infer<typeof formSchema>;
