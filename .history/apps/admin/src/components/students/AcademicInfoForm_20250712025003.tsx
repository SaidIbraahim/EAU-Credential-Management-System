import React, { useState, useEffect } from 'react';
import { Control, useWatch } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

import { Faculty, Department, AcademicYear } from '@/types';
import { departmentsApi } from '@/api/apiClient';
import { FormValues } from './formSchema';

interface AcademicInfoFormProps {
  control: Control<FormValues>;
  faculties: Faculty[];
  departments: Department[];
  academicYears: AcademicYear[];
}

// Grading policy function
const calculateGradeFromGPA = (gpa: number): string => {
  if (gpa >= 3.5) return 'A';
  if (gpa >= 3.0) return 'B';
  if (gpa >= 2.5) return 'C';
  if (gpa >= 2.0) return 'D';
  return 'F';
};

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

  // Watch GPA value for automatic grade calculation
  const gpaValue = useWatch({ control, name: 'gpa' });

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
  
  // Updated grade options to match the grading policy
  const gradeOptions = [
    { value: "A", label: "A (3.50 - 4.00)", range: "3.50 - 4.00" },
    { value: "B", label: "B (3.00 - 3.49)", range: "3.00 - 3.49" },
    { value: "C", label: "C (2.50 - 2.99)", range: "2.50 - 2.99" },
    { value: "D", label: "D (2.00 - 2.49)", range: "2.00 - 2.49" },
    { value: "F", label: "F (Below 2.00)", range: "Below 2.00" }
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
                    !selectedFacultyId 
                      ? "Select Faculty first" 
                      : isLoadingDepartments 
                        ? "Loading departments..." 
                        : "Select Department"
                  } />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {departments.map((department) => (
                  <SelectItem key={department.id} value={department.id.toString()}>
                    {department.name}
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
                  const gpaVal = value === "" ? undefined : parseFloat(value);
                  field.onChange(gpaVal);
                  
                  // Automatically calculate and set grade based on GPA
                  if (gpaVal && gpaVal >= 0 && gpaVal <= 4) {
                    const calculatedGrade = calculateGradeFromGPA(gpaVal);
                    // Get the form's setValue function to update the grade field
                    const form = (field as any).form || control._formState;
                    if (control._formValues) {
                      control._formValues.grade = calculatedGrade;
                    }
                    // Trigger update for the grade field
                    const event = new CustomEvent('gradeUpdate', { detail: calculatedGrade });
                    document.dispatchEvent(event);
                  }
                }}
                placeholder="e.g., 3.75"
              />
            </FormControl>
            <FormMessage />
            {gpaValue && gpaValue >= 0 && gpaValue <= 4 && (
              <div className="mt-2 text-sm text-blue-600 bg-blue-50 p-2 rounded-md">
                <strong>Auto-calculated Grade:</strong> {calculateGradeFromGPA(gpaValue)} 
                <span className="text-gray-600 ml-2">
                  ({gradeOptions.find(g => g.value === calculateGradeFromGPA(gpaValue))?.range})
                </span>
              </div>
            )}
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="grade"
        render={({ field }) => {
          // Auto-update grade when GPA changes
          React.useEffect(() => {
            if (gpaValue && gpaValue >= 0 && gpaValue <= 4) {
              const calculatedGrade = calculateGradeFromGPA(gpaValue);
              field.onChange(calculatedGrade);
            }
          }, [gpaValue, field]);

          return (
            <FormItem className="space-y-3">
              <FormLabel>Letter Grade *</FormLabel>
              <div className="text-sm text-gray-600 mb-2">
                <strong>Institution Grading Policy:</strong>
                <div className="mt-1 space-y-1">
                  {gradeOptions.map((grade) => (
                    <div key={grade.value} className="flex justify-between text-xs">
                      <span className="font-medium">{grade.value}:</span>
                      <span>{grade.range}</span>
                    </div>
                  ))}
                </div>
              </div>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex flex-wrap gap-6"
                >
                  {gradeOptions.map((grade) => (
                    <div key={grade.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={grade.value} id={grade.value} />
                      <FormLabel htmlFor={grade.value} className="text-sm">
                        {grade.label}
                      </FormLabel>
                    </div>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
              {gpaValue && gpaValue >= 0 && gpaValue <= 4 && (
                <div className="text-xs text-green-600 mt-2">
                  ✓ Grade automatically calculated from GPA
                </div>
              )}
            </FormItem>
          );
        }}
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
          <FormItem>
            <FormLabel>Status *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="UN_CLEARED">Un-Cleared</SelectItem>
                <SelectItem value="CLEARED">Cleared</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default AcademicInfoForm;
