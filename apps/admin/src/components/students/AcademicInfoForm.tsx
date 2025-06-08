import { useEffect, useState } from "react";
import { Control } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { FormValues } from "./formSchema";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Faculty, Department, AcademicYear } from "@/types";
import { departmentsApi } from "@/api/apiClient";
import { Loader2 } from "lucide-react";

interface AcademicInfoFormProps {
  control: Control<any>;
  faculties?: Faculty[];
  departments?: Department[];
  academicYears?: AcademicYear[];
}

const AcademicInfoForm = ({ 
  control,
  faculties = [],
  departments: allDepartments = [],
  academicYears = []
}: AcademicInfoFormProps) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [selectedFacultyId, setSelectedFacultyId] = useState<number | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  useEffect(() => {
    const fetchDepartments = async () => {
      if (selectedFacultyId) {
        setIsLoadingDepartments(true);
        try {
          const departmentsData = await departmentsApi.getByFacultyId(selectedFacultyId);
          setDepartments(departmentsData);
        } catch (error) {
          console.error('Error fetching departments:', error);
          // Fallback to all departments filtered by faculty
          const filteredDepartments = allDepartments.filter(dept => dept.facultyId === selectedFacultyId);
          setDepartments(filteredDepartments);
        } finally {
          setIsLoadingDepartments(false);
        }
      } else {
        setDepartments([]);
      }
    };

    fetchDepartments();
  }, [selectedFacultyId, allDepartments]);

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
    <div className="space-y-4">
      <FormField
        control={control}
        name="facultyId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Faculty *</FormLabel>
            <Select
              onValueChange={(value) => {
                field.onChange(parseInt(value));
                setSelectedFacultyId(parseInt(value));
              }}
              defaultValue={field.value?.toString()}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select Faculty" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {faculties.map((faculty) => (
                  <SelectItem key={faculty.id} value={faculty.id.toString()}>
                    {faculty.name}
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
        name="departmentId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Department *</FormLabel>
            <Select
              onValueChange={(value) => field.onChange(parseInt(value))}
              defaultValue={field.value?.toString()}
              disabled={!selectedFacultyId || isLoadingDepartments}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={
                    isLoadingDepartments 
                      ? "Loading departments..." 
                      : selectedFacultyId 
                        ? "Select Department" 
                        : "Select a faculty first"
                  } />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>
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
        control={control}
        name="academicYearId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Academic Year *</FormLabel>
            <Select
              onValueChange={(value) => field.onChange(parseInt(value))}
              defaultValue={field.value?.toString()}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select Academic Year" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {academicYears.map((year) => (
                  <SelectItem key={year.id} value={year.id.toString()}>
                    {year.academicYear}
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
        render={({ field }) => (
          <FormItem>
            <FormLabel>GPA *</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="4.0"
                {...field}
                value={field.value ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  field.onChange(value === "" ? undefined : parseFloat(value));
                }}
                placeholder="e.g., 3.75"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="grade"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>Letter Grade *</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex flex-wrap gap-6"
              >
                {gradeOptions.map((grade) => (
                  <div key={grade.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={grade.value} id={grade.value} />
                    <FormLabel htmlFor={grade.value}>{grade.label}</FormLabel>
                  </div>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="graduationDate"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Graduation Date *</FormLabel>
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
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
                      <span>Pick a graduation date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={(date) => {
                    field.onChange(date);
                    // Auto-close the popover when a date is selected
                    if (date) {
                      setIsDatePickerOpen(false);
                    }
                  }}
                  fromYear={currentYear - 10}
                  toYear={currentYear + 20}
                  captionLayout="dropdown-buttons"
                  disabled={(date) =>
                    date < new Date("1900-01-01") // Allow future dates for graduation
                  }
                  initialFocus
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
                className="flex flex-wrap gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="CLEARED" id="cleared" />
                  <FormLabel htmlFor="cleared">Cleared</FormLabel>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="UN_CLEARED" id="un_cleared" />
                  <FormLabel htmlFor="un_cleared">Un-Cleared</FormLabel>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default AcademicInfoForm;
