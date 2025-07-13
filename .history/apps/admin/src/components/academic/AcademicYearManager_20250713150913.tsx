import { useState, useEffect } from "react";
import { PlusCircle, Edit2, Trash2, Search, Loader2, Calendar } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

import { AcademicYear } from "@/types";
import { academicYearsApi } from "@/api/apiClient";
import { useOptimizedData } from "@/hooks/useOptimizedData";
import { 
  CACHE_KEYS, 
  ACADEMIC_CACHE_CONFIG, 
  invalidateAcademicCache 
} from "@/lib/cacheConfig";

const academicYearFormSchema = z.object({
  academicYear: z.string()
    .min(1, "Academic year is required")
    .regex(/^\d{4}-\d{4}$/, "Academic year must be in format YYYY-YYYY (e.g., 2023-2024)")
    .refine((value) => {
      const [startYear, endYear] = value.split('-').map(Number);
      return endYear === startYear + 1;
    }, "End year must be one year after start year"),
  isActive: z.boolean().default(false),
});

type AcademicYearFormValues = z.infer<typeof academicYearFormSchema>;

interface AcademicYearManagerProps {
  preloadedAcademicYears?: AcademicYear[];
  isLoading?: boolean;
}

const AcademicYearManager = ({ preloadedAcademicYears, isLoading: parentLoading }: AcademicYearManagerProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAcademicYear, setEditingAcademicYear] = useState<AcademicYear | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use preloaded data if available, otherwise fetch with optimized caching
  const {
    data: academicYears,
    isLoading,
    refetch: refetchAcademicYears,
    invalidateAndRefetch: invalidateAndRefetchAcademicYears // 🚀 NEW: Combined function
  } = useOptimizedData(
    () => academicYearsApi.getAll(),
    { 
      cacheKey: CACHE_KEYS.ACADEMIC_YEARS,
      ...ACADEMIC_CACHE_CONFIG
    }
  );

  // Use preloaded data if provided
  // 🚀 REMOVED: Preloaded data pattern was preventing real-time updates
  // const finalAcademicYears = preloadedAcademicYears || academicYears;
  const finalAcademicYears = academicYears; // Always use fresh data

  // 🚀 FIXED: Always check actual loading state instead of preloaded data
  // const isLoadingData = !preloadedAcademicYears && isLoading;
  const isLoadingData = isLoading;

  const form = useForm<AcademicYearFormValues>({
    resolver: zodResolver(academicYearFormSchema),
    defaultValues: {
      academicYear: "",
      isActive: false,
    },
  });

  const filteredAcademicYears = finalAcademicYears?.filter((year) =>
    year.academicYear.includes(searchTerm)
  ) || [];

  const openDialog = (academicYear?: AcademicYear) => {
    if (academicYear) {
      setEditingAcademicYear(academicYear);
      form.reset({
        academicYear: academicYear.academicYear,
        isActive: academicYear.isActive,
      });
    } else {
      setEditingAcademicYear(null);
      form.reset({
        academicYear: "",
        isActive: false,
      });
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setIsSubmitting(false);
    setEditingAcademicYear(null);
    form.reset();
  };

  const onSubmit = async (values: AcademicYearFormValues) => {
    try {
      setIsSubmitting(true);
      
      if (editingAcademicYear) {
        // Update existing academic year
        await academicYearsApi.update(editingAcademicYear.id, {
          academicYear: values.academicYear,
          isActive: values.isActive
        });
        
        toast.success("Academic year updated successfully");
      } else {
        // Add new academic year
        await academicYearsApi.create({
          academicYear: values.academicYear,
          isActive: values.isActive
        });
        
        toast.success("Academic year added successfully");
      }
      
      // 🚀 SIMPLIFIED: With preloaded data pattern removed, only need local cache invalidation
      // invalidateAcademicCache(); // No longer needed - was for parent component
      invalidateAndRefetchAcademicYears(); // Local cache invalidation and refetch
      
      console.log('✅ Academic year cache invalidated and refetched - new items should appear immediately');
      
      closeDialog();
    } catch (error: any) {
      console.error('Error saving academic year:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save academic year';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteAcademicYear = async (academicYearId: number) => {
    try {
      await academicYearsApi.delete(academicYearId);
      
      // 🚀 CRITICAL FIX: Use new combined function for better timing
      // This ensures proper cache clearing and fresh data fetch
      invalidateAcademicCache(); // Clear global cache
      invalidateAndRefetchAcademicYears(); // Clear local cache and refetch with delay
      
      console.log('✅ Academic year deleted - cache invalidated and refetched for real-time updates');
      
      toast.success("Academic year deleted successfully");
    } catch (error: any) {
      console.error('Error deleting academic year:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete academic year';
      toast.error(errorMessage);
    }
  };

  const generateAcademicYear = (startYear: number) => {
    return `${startYear}-${startYear + 1}`;
  };

  const getCurrentYear = () => new Date().getFullYear();

  if (isLoadingData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading academic years...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Academic Years
          </CardTitle>
          <Button variant="default" onClick={() => openDialog()}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Academic Year
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search academic years..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          
          {!finalAcademicYears || finalAcademicYears.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <p className="text-muted-foreground">No academic years found</p>
              <Button variant="outline" className="mt-4" onClick={() => openDialog()}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Your First Academic Year
              </Button>
            </div>
          ) : filteredAcademicYears.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <p className="text-muted-foreground">No academic years match your search</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAcademicYears.map(academicYear => (
                  <TableRow key={academicYear.id}>
                    <TableCell className="font-medium">{academicYear.academicYear}</TableCell>
                    <TableCell>
                      <Badge variant={academicYear.isActive ? "default" : "secondary"}>
                        {academicYear.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(academicYear.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4"
                            >
                              <circle cx="12" cy="12" r="1" />
                              <circle cx="12" cy="5" r="1" />
                              <circle cx="12" cy="19" r="1" />
                            </svg>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openDialog(academicYear)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteAcademicYear(academicYear.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingAcademicYear ? "Edit Academic Year" : "Add New Academic Year"}
            </DialogTitle>
            <DialogDescription>
              {editingAcademicYear 
                ? "Update the academic year information below."
                : "Add a new academic year to the system. Use format YYYY-YYYY."
              }
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="academicYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Academic Year *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={`e.g., ${generateAcademicYear(getCurrentYear())}`}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Set as Active</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Mark this academic year as currently active
                      </p>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeDialog}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingAcademicYear ? "Updating..." : "Adding..."}
                    </>
                  ) : (
                    editingAcademicYear ? "Update Academic Year" : "Add Academic Year"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AcademicYearManager;
