import { useState } from "react";
import { PlusCircle, Edit2, Trash2 } from "lucide-react";
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

// In a real application, this would be fetched from an API
import { FACULTIES } from "@/mock/academicData";
import { Faculty } from "@/types";

const facultyFormSchema = z.object({
  name: z.string().min(2, "Faculty name is required"),
  code: z.string().min(1, "Faculty code is required"),
  description: z.string().optional(),
});

type FacultyFormValues = z.infer<typeof facultyFormSchema>;

const FacultyManager = () => {
  const [faculties, setFaculties] = useState<Faculty[]>(FACULTIES);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentFaculty, setCurrentFaculty] = useState<Faculty | null>(null);

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
    form.reset();
  };

  const onSubmit = (values: FacultyFormValues) => {
    if (isEditing && currentFaculty) {
      // Update existing faculty - ensure all required properties are included
      setFaculties(prevFaculties =>
        prevFaculties.map(faculty =>
          faculty.id === currentFaculty.id
            ? {
                ...faculty,
                name: values.name,
                code: values.code,
                description: values.description,
                updated_at: new Date()
              }
            : faculty
        )
      );
      toast.success("Faculty updated successfully");
    } else {
      // Add new faculty - ensure all required properties are included
      const newFaculty: Faculty = {
        id: faculties.length + 1,
        name: values.name,
        code: values.code,
        description: values.description || "",
        created_at: new Date(),
        updated_at: new Date(),
      };
      setFaculties(prev => [...prev, newFaculty]);
      toast.success("Faculty added successfully");
    }
    closeDialog();
  };

  const deleteFaculty = (facultyId: number) => {
    setFaculties(prevFaculties => prevFaculties.filter(faculty => faculty.id !== facultyId));
    toast.success("Faculty deleted successfully");
  };

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
          {faculties.length === 0 ? (
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
                {faculties.map(faculty => (
                  <TableRow key={faculty.id}>
                    <TableCell className="font-medium">{faculty.name}</TableCell>
                    <TableCell>{faculty.code}</TableCell>
                    <TableCell>{faculty.description || "-"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openDialog(faculty)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => deleteFaculty(faculty.id)}
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
            <DialogTitle>{isEditing ? "Edit Faculty" : "Add Faculty"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the faculty information below."
                : "Enter the details for the new faculty."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Faculty Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Engineering" {...field} />
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
                    <FormLabel>Faculty Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. ENG" {...field} />
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
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Brief description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit">{isEditing ? "Update" : "Add"} Faculty</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FacultyManager;
