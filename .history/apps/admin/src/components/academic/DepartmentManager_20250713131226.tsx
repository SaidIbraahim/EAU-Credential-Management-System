import { useState, useEffect } from "react";
import { PlusCircle, Edit2, Trash2, Search, Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { Department, Faculty } from "@/types";
import { departmentsApi, facultiesApi } from "@/api/apiClient";
import { useOptimizedData } from "@/hooks/useOptimizedData";
import { 
  CACHE_KEYS, 
  ACADEMIC_CACHE_CONFIG, 
  invalidateAcademicCache 
} from "@/lib/cacheConfig";

const departmentFormSchema = z.object({
  name: z.string().min(2, "Department name is required"),
  code: z.string().min(1, "Department code is required"),
  description: z.string().optional(),
  facultyId: z.number().min(1, "Faculty is required"),
});

type DepartmentFormValues = z.infer<typeof departmentFormSchema>;

interface DepartmentManagerProps {
  preloadedDepartments?: Department[];
  preloadedFaculties?: Faculty[];
}

const DepartmentManager = ({ 
  preloadedDepartments, 
  preloadedFaculties 
}: DepartmentManagerProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use preloaded data if available, otherwise fetch with optimized caching
  const {
    data: departments,
    isLoading: departmentsLoading, // 🚀 RENAMED: to avoid conflict with combined isLoading
    refetch: refetchDepartments,
    invalidateAndRefetch: invalidateAndRefetchDepartments // 🚀 NEW: Combined function
  } = useOptimizedData(
    () => departmentsApi.getAll(),
    { 
      cacheKey: CACHE_KEYS.DEPARTMENTS,
      ...ACADEMIC_CACHE_CONFIG
    }
  );

  const {
    data: faculties,
    isLoading: facultiesLoading
  } = useOptimizedData(
    () => facultiesApi.getAll(),
    { 
      cacheKey: CACHE_KEYS.FACULTIES,
      ...ACADEMIC_CACHE_CONFIG
    }
  );

  // Use preloaded data if provided
  const finalDepartments = preloadedDepartments || departments;
  const finalFaculties = preloadedFaculties || faculties;

  // 🚀 COMBINED LOADING STATE: Now works without naming conflict
  const isLoading = (!preloadedDepartments && departmentsLoading) || (!preloadedFaculties && facultiesLoading);

  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      facultyId: 0,
    },
  });

  const filteredDepartments = finalDepartments?.filter(
    (dept) =>
      dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.code.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const openDialog = (department?: Department) => {
    if (department) {
      setEditingDepartment(department);
      form.reset({
        name: department.name,
        code: department.code,
        description: department.description || "",
        facultyId: department.facultyId,
      });
    } else {
      setEditingDepartment(null);
      form.reset({
        name: "",
        code: "",
        description: "",
        facultyId: 0,
      });
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setIsSubmitting(false);
    setEditingDepartment(null);
    form.reset();
  };

  const onSubmit = async (values: DepartmentFormValues) => {
    try {
      setIsSubmitting(true);
      
      if (editingDepartment) {
        // Update existing department
        await departmentsApi.update(editingDepartment.id, {
          name: values.name,
          code: values.code,
          description: values.description || undefined,
          facultyId: values.facultyId
        });
        
        toast.success("Department updated successfully");
      } else {
        // Add new department
        await departmentsApi.create({
          name: values.name,
          code: values.code,
          description: values.description || undefined,
          facultyId: values.facultyId
        });
        
        toast.success("Department added successfully");
      }
      
      // 🚀 CRITICAL FIX: Use new combined function for better timing
      // This ensures proper cache clearing and fresh data fetch
      invalidateDepartmentCache(); // Clear global cache
      invalidateAndRefetchDepartments(); // Clear local cache and refetch with delay
      
      console.log('✅ Department cache invalidated and refetched - new items should appear immediately');
      
      closeDialog();
    } catch (error: any) {
      console.error('Error saving department:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save department';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteDepartment = async (departmentId: number) => {
    try {
      await departmentsApi.delete(departmentId);
      
      // 🚀 CRITICAL FIX: Use new combined function for better timing
      // This ensures proper cache clearing and fresh data fetch
      invalidateDepartmentCache(); // Clear global cache
      invalidateAndRefetchDepartments(); // Clear local cache and refetch with delay
      
      console.log('✅ Department deleted - cache invalidated and refetched for real-time updates');
      
      toast.success("Department deleted successfully");
    } catch (error: any) {
      console.error('Error deleting department:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete department';
      toast.error(errorMessage);
    }
  };

  const getFacultyName = (facultyId: number) => {
    const faculty = finalFaculties?.find(f => f.id === facultyId);
    return faculty?.name || 'Unknown Faculty';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading departments...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Departments</CardTitle>
          <Button variant="default" onClick={() => openDialog()}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Department
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          
          {!finalDepartments || finalDepartments.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <p className="text-muted-foreground">No departments found</p>
              <Button variant="outline" className="mt-4" onClick={() => openDialog()}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Your First Department
              </Button>
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <p className="text-muted-foreground">No departments match your search</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Faculty</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDepartments.map(department => (
                  <TableRow key={department.id}>
                    <TableCell className="font-medium">{department.name}</TableCell>
                    <TableCell>{department.code}</TableCell>
                    <TableCell>{getFacultyName(department.facultyId)}</TableCell>
                    <TableCell>{department.description || "-"}</TableCell>
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
                          <DropdownMenuItem onClick={() => openDialog(department)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteDepartment(department.id)}
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
                  {editingDepartment ? "Edit Department" : "Add New Department"}
                </DialogTitle>
                <DialogDescription>
                  {editingDepartment
                ? "Update the department information below."
                : "Add a new department to the system. Fill in the required details."
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
                        <FormLabel>Department Name *</FormLabel>
                        <FormControl>
                      <Input placeholder="e.g., Computer Science" {...field} />
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
                        <FormLabel>Department Code *</FormLabel>
                        <FormControl>
                      <Input placeholder="e.g., CS" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="facultyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Faculty *</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a faculty" />
                        </SelectTrigger>
                        </FormControl>
                      <SelectContent>
                        {finalFaculties?.map((faculty) => (
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
                      {editingDepartment ? "Updating..." : "Adding..."}
                    </>
                  ) : (
                    editingDepartment ? "Update Department" : "Add Department"
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

export default DepartmentManager;
