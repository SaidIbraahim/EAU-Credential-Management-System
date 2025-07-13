import { useState, useEffect } from "react";
import { PlusCircle, Edit2, Trash2, Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";

import { Faculty } from "@/types";
import { facultiesApi } from "@/api/apiClient";
import { useOptimizedData } from "@/hooks/useOptimizedData";
import { 
  CACHE_KEYS, 
  ACADEMIC_CACHE_CONFIG,
  invalidateFacultyCache 
} from "@/lib/cacheConfig";

const facultyFormSchema = z.object({
  name: z.string().min(2, "Faculty name is required"),
  code: z.string().min(1, "Faculty code is required"),
  description: z.string().optional(),
});

type FacultyFormValues = z.infer<typeof facultyFormSchema>;

interface FacultyManagerProps {
  preloadedFaculties?: Faculty[];
}

const FacultyManager = ({ preloadedFaculties }: FacultyManagerProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentFaculty, setCurrentFaculty] = useState<Faculty | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use preloaded data if available, otherwise fetch with optimized caching
  const {
    data: faculties,
    isLoading,
    refetch: refetchFaculties,
    invalidateAndRefetch: invalidateAndRefetchFaculties // 🚀 NEW: Combined function
  } = useOptimizedData(
    () => facultiesApi.getAll(),
    { 
      cacheKey: CACHE_KEYS.FACULTIES,
      ...ACADEMIC_CACHE_CONFIG
    }
  );

  // Use preloaded data if provided
  const finalFaculties = preloadedFaculties || faculties;

  const form = useForm<FacultyFormValues>({
    resolver: zodResolver(facultyFormSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
    },
  });

  const openDialog = (faculty?: Faculty) => {
    if (faculty) {
      setIsEditing(true);
      setCurrentFaculty(faculty);
      form.reset({
        name: faculty.name,
        code: faculty.code,
        description: faculty.description || "",
      });
    } else {
      setIsEditing(false);
      setCurrentFaculty(null);
      form.reset({
        name: "",
        code: "",
        description: "",
      });
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setIsSubmitting(false);
    form.reset();
  };

  const onSubmit = async (values: FacultyFormValues) => {
    try {
      setIsSubmitting(true);
      
      if (isEditing && currentFaculty) {
        // Update existing faculty
        await facultiesApi.update(currentFaculty.id, {
          name: values.name,
          code: values.code,
          description: values.description || undefined
        });
        
        toast.success("Faculty updated successfully");
      } else {
        // Add new faculty
        await facultiesApi.create({
          name: values.name,
          code: values.code,
          description: values.description || undefined
        });
        
        toast.success("Faculty added successfully");
      }
      
      // 🚀 CRITICAL FIX: Use new combined function for better timing
      // This ensures proper cache clearing and fresh data fetch
      invalidateFacultyCache(); // Clear global cache
      invalidateAndRefetchFaculties(); // Clear local cache and refetch with delay
      
      console.log('✅ Faculty cache invalidated and refetched - new items should appear immediately');
      
      closeDialog();
    } catch (error: any) {
      console.error('Error saving faculty:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save faculty';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteFaculty = async (facultyId: number) => {
    try {
      await facultiesApi.delete(facultyId);
      
      // 🚀 CRITICAL FIX: Use new combined function for better timing
      // This ensures proper cache clearing and fresh data fetch
      invalidateFacultyCache(); // Clear global cache
      invalidateAndRefetchFaculties(); // Clear local cache and refetch with delay
      
      console.log('✅ Faculty deleted - cache invalidated and refetched for real-time updates');
      
      toast.success("Faculty deleted successfully");
    } catch (error: any) {
      console.error('Error deleting faculty:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete faculty';
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading faculties...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Faculties</CardTitle>
          <Button variant="default" onClick={() => openDialog()}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Faculty
          </Button>
        </CardHeader>
        <CardContent>
          {!finalFaculties || finalFaculties.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <p className="text-muted-foreground">No faculties found</p>
              <Button variant="outline" className="mt-4" onClick={() => openDialog()}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Your First Faculty
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {finalFaculties.map(faculty => (
                  <TableRow key={faculty.id}>
                    <TableCell className="font-medium">{faculty.name}</TableCell>
                    <TableCell>{faculty.code}</TableCell>
                    <TableCell>{faculty.description || "-"}</TableCell>
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
                          <DropdownMenuItem onClick={() => openDialog(faculty)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteFaculty(faculty.id)}
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Faculty" : "Add New Faculty"}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Update the faculty information below."
                : "Add a new faculty to the system. Fill in the required details."
              }
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Faculty Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Faculty of Engineering" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Faculty Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., ENG" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Optional description..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
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
                      {isEditing ? "Updating..." : "Adding..."}
                    </>
                  ) : (
                    isEditing ? "Update Faculty" : "Add Faculty"
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

export default FacultyManager;
