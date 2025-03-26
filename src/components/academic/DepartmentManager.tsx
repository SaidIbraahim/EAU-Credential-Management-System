
import { useState } from "react";
import { Building, Plus, Edit, Trash2, Search } from "lucide-react";
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
import { Department } from "@/types";

// Form schema for department
const departmentFormSchema = z.object({
  name: z.string().min(3, { message: "Department name must be at least 3 characters" }),
  code: z.string().min(1, { message: "Department code is required" })
    .max(10, { message: "Department code must be less than 10 characters" })
    .refine(code => /^[A-Z0-9]+$/.test(code), {
      message: "Department code must contain only uppercase letters and numbers"
    }),
  description: z.string().optional(),
});

type DepartmentFormValues = z.infer<typeof departmentFormSchema>;

const DepartmentManager = () => {
  const [departments, setDepartments] = useState<Department[]>([
    {
      id: 1,
      name: "Computer Science",
      code: "CS",
      description: "Computer Science and Engineering",
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 2,
      name: "Medicine",
      code: "MED",
      description: "Faculty of Medicine",
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 3,
      name: "Engineering",
      code: "ENG",
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 4,
      name: "Business",
      code: "BUS",
      description: "Faculty of Business Administration",
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 5,
      name: "Law",
      code: "LAW",
      description: "Faculty of Law and Legal Studies",
      created_at: new Date(),
      updated_at: new Date(),
    }
  ]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);

  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
    },
  });

  const filteredDepartments = departments.filter(
    (dept) =>
      dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddEdit = (values: DepartmentFormValues) => {
    if (editingDepartment) {
      // Update existing department
      setDepartments(
        departments.map((dept) =>
          dept.id === editingDepartment.id
            ? {
                ...dept,
                name: values.name,
                code: values.code,
                description: values.description,
                updated_at: new Date(),
              }
            : dept
        )
      );
      toast.success(`Department "${values.name}" updated successfully`);
    } else {
      // Add new department
      const newDepartment: Department = {
        id: departments.length ? Math.max(...departments.map((d) => d.id)) + 1 : 1,
        name: values.name,
        code: values.code,
        description: values.description,
        created_at: new Date(),
        updated_at: new Date(),
      };
      setDepartments([...departments, newDepartment]);
      toast.success(`Department "${values.name}" added successfully`);
    }
    
    setDialogOpen(false);
    setEditingDepartment(null);
    form.reset();
  };

  const handleDelete = (id: number) => {
    setDepartments(departments.filter((dept) => dept.id !== id));
    toast.success("Department deleted successfully");
  };

  const openEditDialog = (department: Department) => {
    setEditingDepartment(department);
    form.reset({
      name: department.name,
      code: department.code,
      description: department.description || "",
    });
    setDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Building className="h-6 w-6" />
          Departments
        </CardTitle>
        <CardDescription>
          Create and manage departments for student registration
        </CardDescription>
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search departments..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingDepartment(null);
                  form.reset({
                    name: "",
                    code: "",
                    description: "",
                  });
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Department
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingDepartment ? "Edit Department" : "Add New Department"}
                </DialogTitle>
                <DialogDescription>
                  {editingDepartment
                    ? "Update the department details below"
                    : "Fill in the details for the new department"}
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAddEdit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Computer Science" {...field} />
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
                          <Input placeholder="CS" {...field} />
                        </FormControl>
                        <FormDescription>
                          A short unique identifier (e.g., CS, MED, ENG)
                        </FormDescription>
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
                          <Input placeholder="Department description..." {...field} />
                        </FormControl>
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
                        setEditingDepartment(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingDepartment ? "Update Department" : "Add Department"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {filteredDepartments.length === 0 ? (
          searchTerm ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No departments found matching "{searchTerm}"</p>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No departments added yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Click the "Add Department" button to create your first department
              </p>
            </div>
          )
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDepartments.map((department) => (
                  <TableRow key={department.id}>
                    <TableCell className="font-medium">{department.name}</TableCell>
                    <TableCell>{department.code}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {department.description || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(department)}
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
                                Are you sure you want to delete the department "{department.name}"?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(department.id)}
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
          Total: {filteredDepartments.length} department(s)
        </div>
      </CardFooter>
    </Card>
  );
};

export default DepartmentManager;
