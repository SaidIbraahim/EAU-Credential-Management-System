
import * as z from "zod";

export const formSchema = z.object({
  full_name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  registration_no: z.string()
    .min(8, { message: "Registration Number must be at least 8 characters" })
    .refine(id => /^[A-Za-z0-9-]+$/.test(id), {
      message: "Registration Number can only contain letters, numbers, and hyphens"
    }),
  certificate_id: z.string()
    .optional()
    .refine(id => !id || /^\d{4}$/.test(id), {
      message: "Certificate Serial No must be a four-digit number"
    }),
  gender: z.enum(["male", "female"]),
  phone_number: z.string().optional(),
  department_id: z.string(),
  faculty: z.string().optional(),
  academic_year_id: z.string(),
  gpa: z.coerce.number()
    .min(0, { message: "GPA must be at least 0" })
    .max(4.0, { message: "GPA must be no more than 4.0" })
    .step(0.01, { message: "GPA can have up to 2 decimal places" })
    .optional()
    .or(z.literal('')),
  grade: z.string({ required_error: "Grade is required" }),
  graduation_date: z.date({
    required_error: "Graduation date is required",
  }).refine(date => {
    // Ensure graduation date is valid and not in the future
    return date instanceof Date && !isNaN(date.getTime());
  }, {
    message: "Please provide a valid graduation date",
  }),
  status: z.enum(["cleared", "un-cleared"]),
});

export type FormValues = z.infer<typeof formSchema>;
