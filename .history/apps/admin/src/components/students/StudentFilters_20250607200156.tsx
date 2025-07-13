import { useState } from "react";
import { Search, Filter, X, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Essential search fields only
  const searchFields = [
    { value: "all", label: "All Fields" },
    { value: "full_name", label: "Name" },
    { value: "registration_no", label: "Registration No" },
    { value: "certificate_id", label: "Certificate ID" },
  ];

  // Essential status options
  const statuses = [
    { label: "Cleared", value: "CLEARED" },
    { label: "Un-cleared", value: "UN_CLEARED" },
  ];

  // Get active essential filters (excluding deprecated ones)
  const getEssentialFilterCount = () => {
    const essentialFilters = {
      department: filters.department,
      status: filters.status,
      academicYear: filters.academicYear,
    };
    return Object.values(essentialFilters).filter(Boolean).length + (searchQuery ? 1 : 0);
  };

  const essentialFilterCount = getEssentialFilterCount();

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          Search & Filter Students
          {essentialFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {essentialFilterCount} active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary Search Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search students by name, registration, or certificate..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
          <Select value={searchField} onValueChange={onSearchFieldChange}>
            <SelectTrigger className="w-32 h-10">
              <SelectValue placeholder="Search in" />
            </SelectTrigger>
            <SelectContent>
              {searchFields.map((field) => (
                <SelectItem key={field.value} value={field.value}>
                  {field.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Essential Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Department Filter */}
          <div>
            <Select
              value={filters.department}
              onValueChange={(value) => onFilterChange("department", value)}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="All Departments" />
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

          {/* Academic Year Filter */}
          <div>
            <Select
              value={filters.academicYear}
              onValueChange={(value) => onFilterChange("academicYear", value)}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_years">All Academic Years</SelectItem>
                {ACADEMIC_YEARS.map((year) => (
                  <SelectItem key={year.id} value={year.academic_year}>
                    {year.academic_year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div>
            <Select
              value={filters.status}
              onValueChange={(value) => onFilterChange("status", value)}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-2">
          <div className="flex items-center gap-2">
            {essentialFilterCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilters}
                className="text-gray-600 hover:text-gray-900"
              >
                <X className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            )}
          </div>
          
          <div className="text-xs text-gray-500">
            Use filters to narrow down the student list
          </div>
        </div>

        {/* Active Filter Tags */}
        {essentialFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
            {searchQuery && (
              <Badge
                variant="secondary"
                className="px-2 py-1 gap-1 text-xs bg-blue-50 text-blue-700 border-blue-200"
              >
                Search: {searchQuery.length > 15 ? searchQuery.substring(0, 15) + '...' : searchQuery}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-blue-900"
                  onClick={() => onSearchChange('')}
                />
              </Badge>
            )}
            {filters.department && (
              <Badge
                variant="secondary"
                className="px-2 py-1 gap-1 text-xs bg-green-50 text-green-700 border-green-200"
              >
                Department: {filters.department}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-green-900"
                  onClick={() => onFilterChange('department', '')}
                />
              </Badge>
            )}
            {filters.academicYear && (
              <Badge
                variant="secondary"
                className="px-2 py-1 gap-1 text-xs bg-purple-50 text-purple-700 border-purple-200"
              >
                Year: {filters.academicYear}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-purple-900"
                  onClick={() => onFilterChange('academicYear', '')}
                />
              </Badge>
            )}
            {filters.status && (
              <Badge
                variant="secondary"
                className="px-2 py-1 gap-1 text-xs bg-orange-50 text-orange-700 border-orange-200"
              >
                Status: {filters.status === 'CLEARED' ? 'Cleared' : 'Un-cleared'}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-orange-900"
                  onClick={() => onFilterChange('status', '')}
                />
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentFilters;
