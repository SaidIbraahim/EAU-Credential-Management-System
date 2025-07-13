import React, { useState, useEffect } from 'react';
import { Control, useWatch } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Info } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="facultyId"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium text-gray-700">Faculty *</FormLabel>
            <Select
              onValueChange={(value) => {
                field.onChange(parseInt(value));
                setSelectedFacultyId(parseInt(value));
              }}
              defaultValue={field.value?.toString()}
            >
              <FormControl>
                <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
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
            <FormLabel className="text-sm font-medium text-gray-700">Department *</FormLabel>
            <Select
              onValueChange={(value) => field.onChange(parseInt(value))}
              defaultValue={field.value?.toString()}
              disabled={!selectedFacultyId || isLoadingDepartments}
            >
              <FormControl>
                <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
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
            <FormLabel className="text-sm font-medium text-gray-700">Academic Year *</FormLabel>
            <Select
              onValueChange={(value) => field.onChange(parseInt(value))}
              defaultValue={field.value?.toString()}
            >
              <FormControl>
                <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="gpa"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-700">GPA *</FormLabel>
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
                  }}
                  placeholder="e.g., 3.75"
                  className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </FormControl>
              {gpaValue && gpaValue >= 0 && gpaValue <= 4 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1 text-xs text-blue-600">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    Auto-calculated: <span className="font-medium">{calculateGradeFromGPA(gpaValue)}</span>
                  </div>
                </div>
              )}
              <FormMessage />
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
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Letter Grade *
                  <button
                    type="button"
                    className="ml-2 text-gray-400 hover:text-gray-600"
                    title="A: 3.50-4.00 | B: 3.00-3.49 | C: 2.50-2.99 | D: 2.00-2.49 | F: Below 2.00"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="flex flex-wrap gap-4"
                  >
                    {[
                      { value: "A", label: "A" },
                      { value: "B", label: "B" },
                      { value: "C", label: "C" },
                      { value: "D", label: "D" },
                      { value: "F", label: "F" }
                    ].map((grade) => (
                      <div key={grade.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={grade.value} id={grade.value} />
                        <FormLabel 
                          htmlFor={grade.value} 
                          className="text-sm font-medium text-gray-700 cursor-pointer"
                        >
                          {grade.label}
                        </FormLabel>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      </div>

      <FormField
        control={control}
        name="graduationDate"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel className="text-sm font-medium text-gray-700">Graduation Date *</FormLabel>
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "h-11 w-full pl-3 text-left font-normal border-gray-300 focus:border-blue-500 focus:ring-blue-500",
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
                    if (date) {
                      setIsDatePickerOpen(false);
                    }
                  }}
                  fromYear={currentYear - 10}
                  toYear={currentYear + 20}
                  captionLayout="dropdown-buttons"
                  disabled={(date) =>
                    date < new Date("1900-01-01")
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
            <FormLabel className="text-sm font-medium text-gray-700">Status *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
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
