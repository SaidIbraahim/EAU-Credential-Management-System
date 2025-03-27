
import { Control } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "../ui/form";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select";
import { Input } from "../ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { FormValues } from "./formSchema";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

interface Department {
  id: number;
  name: string;
  code: string;
}

interface AcademicYear {
  id: number;
  academic_year: string;
}

interface AcademicInfoFormProps {
  control: Control<FormValues>;
  departments: Department[];
  academicYears: AcademicYear[];
}

const AcademicInfoForm = ({ control, departments, academicYears }: AcademicInfoFormProps) => {
  const currentYear = new Date().getFullYear();
  const fromYear = currentYear - 20; // Allow selecting dates from 20 years ago
  
  // Simplified grade options - only A through F without + or -
  const gradeOptions = [
    { value: "A", label: "A" },
    { value: "B", label: "B" },
    { value: "C", label: "C" },
    { value: "D", label: "D" },
    { value: "F", label: "F" }
  ];
  
  return (
    <>
      <FormField
        control={control}
        name="department_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Department *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {departments.map((department) => (
                  <SelectItem 
                    key={department.id} 
                    value={department.id.toString()}
                  >
                    {department.name} ({department.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="academic_year_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Academic Year *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select academic year" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {academicYears.map((year) => (
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
        control={control}
        name="gpa"
        render={({ field: { value, onChange, ...field } }) => (
          <FormItem>
            <FormLabel>GPA *</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                placeholder="Enter GPA (0.0-4.0)" 
                step="0.1" 
                min="0" 
                max="4.0"
                {...field} 
                value={value === 0 ? "" : value}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  if (inputValue === '') {
                    onChange(undefined); // Set to undefined when empty
                  } else {
                    const value = parseFloat(inputValue);
                    if (!isNaN(value) && value >= 0 && value <= 4) {
                      onChange(value);
                    }
                  }
                }}
              />
            </FormControl>
            <FormDescription>
              Enter a value between 0.0 and 4.0
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="grade"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Grade</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a grade" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {gradeOptions.map((grade) => (
                  <SelectItem key={grade.value} value={grade.value}>
                    {grade.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
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
                  fromYear={fromYear}
                  toYear={currentYear}
                  captionLayout="dropdown-buttons"
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
        control={control}
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
                  selected={field.value}
                  onSelect={field.onChange}
                  fromYear={fromYear}
                  toYear={currentYear + 5} // Allow selecting future dates for graduation
                  captionLayout="dropdown-buttons"
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="status"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>Status *</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cleared" id="cleared" />
                  <label htmlFor="cleared">Cleared</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="un-cleared" id="un-cleared" />
                  <label htmlFor="un-cleared">Un-cleared</label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};

export default AcademicInfoForm;
