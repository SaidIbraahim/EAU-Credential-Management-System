import { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEPARTMENTS, ACADEMIC_YEARS } from "@/mock/academicData";

interface StudentFiltersProps {
  searchQuery: string;
  searchField: string;
  filters: {
    department: string;
    status: string;
    academicYear: string;
    gpaRange: string;
    gender: string;
  };
  onSearchChange: (value: string) => void;
  onSearchFieldChange: (value: string) => void;
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  activeFilterCount: number;
}

const StudentFilters = ({
  searchQuery,
  searchField,
  filters,
  onSearchChange,
  onSearchFieldChange,
  onFilterChange,
  onClearFilters,
  activeFilterCount,
}: StudentFiltersProps) => {
  const gpaRanges = [
    { label: "3.5 - 4.0", value: "3.5-4.0" },
    { label: "3.0 - 3.5", value: "3.0-3.5" },
    { label: "2.5 - 3.0", value: "2.5-3.0" },
    { label: "2.0 - 2.5", value: "2.0-2.5" },
    { label: "Below 2.0", value: "below-2.0" },
  ];

  const statuses = [
    { label: "Cleared", value: "cleared" },
    { label: "Un-cleared", value: "un-cleared" },
  ];

  const genders = [
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
  ];

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none sm:min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={searchField} onValueChange={onSearchFieldChange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Search in" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Fields</SelectItem>
              <SelectItem value="student_id">Student ID</SelectItem>
              <SelectItem value="full_name">Name</SelectItem>
              <SelectItem value="certificate_id">Certificate</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="relative"
                title="Filter students"
              >
                <Filter className="h-4 w-4" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>Filter Students</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <div className="p-2">
                <p className="text-xs font-medium mb-1">Department</p>
                <Select
                  value={filters.department}
                  onValueChange={(value) => onFilterChange("department", value)}
                >
                  <SelectTrigger className="w-full h-8">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_departments">All Departments</SelectItem>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept.id} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="p-2">
                <p className="text-xs font-medium mb-1">Academic Year</p>
                <Select
                  value={filters.academicYear}
                  onValueChange={(value) => onFilterChange("academicYear", value)}
                >
                  <SelectTrigger className="w-full h-8">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_years">All Years</SelectItem>
                    {ACADEMIC_YEARS.map((year) => (
                      <SelectItem key={year.id} value={year.academic_year}>
                        {year.academic_year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="p-2">
                <p className="text-xs font-medium mb-1">GPA Range</p>
                <Select
                  value={filters.gpaRange}
                  onValueChange={(value) => onFilterChange("gpaRange", value)}
                >
                  <SelectTrigger className="w-full h-8">
                    <SelectValue placeholder="Select GPA range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_gpas">All GPAs</SelectItem>
                    {gpaRanges.map((range) => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="p-2">
                <p className="text-xs font-medium mb-1">Status</p>
                <Select
                  value={filters.status}
                  onValueChange={(value) => onFilterChange("status", value)}
                >
                  <SelectTrigger className="w-full h-8">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_statuses">All Status</SelectItem>
                    {statuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="p-2">
                <p className="text-xs font-medium mb-1">Gender</p>
                <Select
                  value={filters.gender}
                  onValueChange={(value) => onFilterChange("gender", value)}
                >
                  <SelectTrigger className="w-full h-8">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_genders">All Genders</SelectItem>
                    {genders.map((gender) => (
                      <SelectItem key={gender.value} value={gender.value}>
                        {gender.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DropdownMenuSeparator />
              <div className="p-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={onClearFilters}
                >
                  Clear All Filters
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 pb-1">
          {searchQuery && (
            <Badge variant="secondary" className="px-2 py-1 gap-1 text-xs">
              Search: {searchQuery.length > 10 ? searchQuery.substring(0, 10) + '...' : searchQuery}
              <X className="h-3 w-3 cursor-pointer" onClick={() => onSearchChange('')} />
            </Badge>
          )}
          {filters.department && (
            <Badge variant="secondary" className="px-2 py-1 gap-1 text-xs">
              Department: {filters.department}
              <X className="h-3 w-3 cursor-pointer" onClick={() => onFilterChange('department', '')} />
            </Badge>
          )}
          {filters.academicYear && (
            <Badge variant="secondary" className="px-2 py-1 gap-1 text-xs">
              Year: {filters.academicYear}
              <X className="h-3 w-3 cursor-pointer" onClick={() => onFilterChange('academicYear', '')} />
            </Badge>
          )}
          {filters.status && (
            <Badge variant="secondary" className="px-2 py-1 gap-1 text-xs">
              Status: {filters.status}
              <X className="h-3 w-3 cursor-pointer" onClick={() => onFilterChange('status', '')} />
            </Badge>
          )}
          {filters.gpaRange && (
            <Badge variant="secondary" className="px-2 py-1 gap-1 text-xs">
              GPA: {filters.gpaRange}
              <X className="h-3 w-3 cursor-pointer" onClick={() => onFilterChange('gpaRange', '')} />
            </Badge>
          )}
          {filters.gender && (
            <Badge variant="secondary" className="px-2 py-1 gap-1 text-xs">
              Gender: {filters.gender}
              <X className="h-3 w-3 cursor-pointer" onClick={() => onFilterChange('gender', '')} />
            </Badge>
          )}
          <Button 
            variant="ghost" 
            className="h-6 text-xs px-2"
            onClick={onClearFilters}
          >
            Clear All
          </Button>
        </div>
      )}
    </div>
  );
};

export default StudentFilters;
