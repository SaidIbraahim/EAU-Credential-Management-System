import * as z from "zod";

export const formSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  registration_no: z.string().min(3, "Registration Number is required"),
  certificate_id: z.string().optional(),
  gender: z.enum(["male", "female"]),
  phone_number: z.string().optional(),
  faculty_id: z.string().optional(),
  department_id: z.string({
    required_error: "Department is required",
  }),
  academic_year_id: z.string({
    required_error: "Academic year is required",
  }),
  gpa: z.number({
    required_error: "GPA is required",
    invalid_type_error: "GPA must be a number between 0.0 and 4.0",
  }).min(0).max(4).or(z.undefined()),
  grade: z.string({
    required_error: "Grade is required",
  }),
  graduation_date: z.date({
    required_error: "Graduation date is required",
  }),
  status: z.enum(["cleared", "un-cleared"]),
});

export type FormValues = z.infer<typeof formSchema>;
