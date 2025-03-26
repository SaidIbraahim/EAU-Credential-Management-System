
import * as z from "zod";

export const formSchema = z.object({
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

export type FormValues = z.infer<typeof formSchema>;
