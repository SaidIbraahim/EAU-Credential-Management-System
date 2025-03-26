
import { useState } from "react";
import { Calendar, Plus, Edit, Trash2, Search } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { AcademicYear } from "@/types";

// Form schema for academic year
const academicYearFormSchema = z.object({
  academic_year: z.string()
    .min(7, { message: "Academic year format must be YYYY-YYYY" })
    .max(9, { message: "Academic year format must be YYYY-YYYY" })
    .refine(year => /^\d{4}-\d{4}$/.test(year), {
      message: "Academic year must be in format YYYY-YYYY"
    })
    .refine(year => {
      const [start, end] = year.split('-').map(Number);
      return end === start + 1;
    }, {
      message: "End year must be one year after start year"
    }),
});

type AcademicYearFormValues = z.infer<typeof academicYearFormSchema>;

const AcademicYearManager = () => {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([
    { id: 1, academic_year: "2020-2021", created_at: new Date(), updated_at: new Date() },
    { id: 2, academic_year: "2021-2022", created_at: new Date(), updated_at: new Date() },
    { id: 3, academic_year: "2022-2023", created_at: new Date(), updated_at: new Date() },
    { id: 4, academic_year: "2023-2024", created_at: new Date(), updated_at: new Date() },
    { id: 5, academic_year: "2024-2025", created_at: new Date(), updated_at: new Date() },
  ]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAcademicYear, setEditingAcademicYear] = useState<AcademicYear | null>(null);

  const form = useForm<AcademicYearFormValues>({
    resolver: zodResolver(academicYearFormSchema),
    defaultValues: {
      academic_year: "",
    },
  });

  const filteredAcademicYears = academicYears.filter((year) =>
    year.academic_year.includes(searchTerm)
  );

  const handleAddEdit = (values: AcademicYearFormValues) => {
    if (editingAcademicYear) {
      // Update existing academic year
      setAcademicYears(
        academicYears.map((year) =>
          year.id === editingAcademicYear.id
            ? {
                ...year,
                academic_year: values.academic_year,
                updated_at: new Date(),
              }
            : year
        )
      );
      toast.success(`Academic Year "${values.academic_year}" updated successfully`);
    } else {
      // Check if academic year already exists
      if (academicYears.some(year => year.academic_year === values.academic_year)) {
        toast.error(`Academic Year "${values.academic_year}" already exists`);
        return;
      }
      
      // Add new academic year
      const newAcademicYear: AcademicYear = {
        id: academicYears.length ? Math.max(...academicYears.map((y) => y.id)) + 1 : 1,
        academic_year: values.academic_year,
        created_at: new Date(),
        updated_at: new Date(),
      };
      setAcademicYears([...academicYears, newAcademicYear]);
      toast.success(`Academic Year "${values.academic_year}" added successfully`);
    }
    
    setDialogOpen(false);
    setEditingAcademicYear(null);
    form.reset();
  };

  const handleDelete = (id: number) => {
    setAcademicYears(academicYears.filter((year) => year.id !== id));
    toast.success("Academic Year deleted successfully");
  };

  const openEditDialog = (academicYear: AcademicYear) => {
    setEditingAcademicYear(academicYear);
    form.reset({
      academic_year: academicYear.academic_year,
    });
    setDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          Academic Years
        </CardTitle>
        <CardDescription>
          Create and manage academic years for student registration
        </CardDescription>
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search academic years..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingAcademicYear(null);
                  form.reset({
                    academic_year: "",
                  });
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Academic Year
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingAcademicYear ? "Edit Academic Year" : "Add New Academic Year"}
                </DialogTitle>
                <DialogDescription>
                  {editingAcademicYear
                    ? "Update the academic year details below"
                    : "Fill in the details for the new academic year"}
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAddEdit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="academic_year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Academic Year *</FormLabel>
                        <FormControl>
                          <Input placeholder="2024-2025" {...field} />
                        </FormControl>
                        <FormDescription>
                          Format: YYYY-YYYY (e.g., 2024-2025)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setDialogOpen(false);
                        setEditingAcademicYear(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingAcademicYear ? "Update Academic Year" : "Add Academic Year"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {filteredAcademicYears.length === 0 ? (
          searchTerm ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No academic years found matching "{searchTerm}"</p>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No academic years added yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Click the "Add Academic Year" button to create your first academic year
              </p>
            </div>
          )
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Academic Year</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAcademicYears.map((year) => (
                  <TableRow key={year.id}>
                    <TableCell className="font-medium">{year.academic_year}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(year)}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-destructive" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the academic year "{year.academic_year}"?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(year.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t p-4">
        <div className="text-sm text-muted-foreground">
          Total: {filteredAcademicYears.length} academic year(s)
        </div>
      </CardFooter>
    </Card>
  );
};

export default AcademicYearManager;
