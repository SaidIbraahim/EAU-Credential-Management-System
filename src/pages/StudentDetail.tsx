
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Save, Trash2, Upload, Download, User, Calendar, GraduationCap, 
  BookOpen, Phone, Award, CheckCircle, AlertCircle, FileText, Edit, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Student, Document } from "@/types";
import { studentsApi, documentsApi, auditLogApi } from "@/api/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const StudentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNewStudent = id === 'new';
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isEditing, setIsEditing] = useState(isNewStudent);
  
  useEffect(() => {
    if (!isNewStudent && id) {
      fetchStudentData(id);
    } else {
      // Initialize with empty student for new form
      setStudent({
        id: 0,
        student_id: '',
        full_name: '',
        gender: 'male',
        department: '',
        academic_year: '',
        gpa: 0,
        grade: '',
        admission_date: new Date(),
        status: 'un-cleared',
        created_at: new Date(),
        updated_at: new Date()
      });
      setIsLoading(false);
    }
  }, [id, isNewStudent]);
  
  const fetchStudentData = async (studentId: string) => {
    setIsLoading(true);
    try {
      const studentData = await studentsApi.getById(studentId);
      setStudent(studentData);
      
      // Fetch documents
      const docs = await documentsApi.getByStudentId(studentId);
      setDocuments(docs);
    } catch (error) {
      console.error("Error fetching student:", error);
      toast.error("Error loading student data");
      navigate("/students");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!student) return;
    
    const { name, value } = e.target;
    setStudent({
      ...student,
      [name]: value
    });
  };
  
  const handleSave = async () => {
    if (!student) return;
    
    setIsSaving(true);
    try {
      if (isNewStudent) {
        // Create new student
        await studentsApi.create(student);
        auditLogApi.logAction("Student Added", `Added student '${student.full_name}' with ID '${student.student_id}'`);
        toast.success("Student created successfully");
      } else {
        // Update existing student
        await studentsApi.update(id!, student);
        auditLogApi.logAction("Student Updated", `Updated information for student '${student.full_name}' with ID '${student.student_id}'`);
        toast.success("Student updated successfully");
      }
      
      setIsEditing(false);
      if (isNewStudent) {
        navigate("/students");
      }
    } catch (error) {
      console.error("Error saving student:", error);
      toast.error("Error saving student data");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDelete = async () => {
    if (!student || !id) return;
    
    if (window.confirm(`Are you sure you want to delete ${student.full_name}?`)) {
      try {
        await studentsApi.delete(id);
        auditLogApi.logAction("Student Deleted", `Removed student '${student.full_name}' with ID '${student.student_id}'`);
        toast.success("Student deleted successfully");
        navigate("/students");
      } catch (error) {
        console.error("Error deleting student:", error);
        toast.error("Error deleting student");
      }
    }
  };
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!id || isNewStudent || !e.target.files || e.target.files.length === 0) return;
    
    const files = Array.from(e.target.files);
    
    try {
      const uploadedDocs = await documentsApi.upload(id, files);
      setDocuments([...documents, ...uploadedDocs]);
      
      auditLogApi.logAction("Document Uploaded", `Uploaded ${files.length} document(s) for student with ID '${student?.student_id}'`);
      toast.success(`${files.length} document(s) uploaded successfully`);
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Error uploading documents");
    }
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };
  
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading student data...</p>
        </div>
      </div>
    );
  }
  
  if (!student) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Student not found</p>
        <Button className="mt-4" onClick={() => navigate("/students")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Students
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto w-full animation-fade-in">
      {/* Header Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/students")} className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                {isNewStudent ? "Register New Student" : student.full_name}
              </h2>
              {!isNewStudent && (
                <p className="text-gray-500 text-sm mt-1">ID: {student.student_id}</p>
              )}
            </div>
            {!isNewStudent && !isEditing && (
              <div className="ml-4 flex items-center">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  student.status === 'cleared' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {student.status === 'cleared' ? 'Cleared' : 'Uncleared'}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            {!isNewStudent && !isEditing && (
              <Button onClick={toggleEditMode} className="bg-blue-500 hover:bg-blue-600 text-white">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
            {!isNewStudent && (
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
            {(isEditing || isNewStudent) && (
              <Button 
                className="bg-primary-500 hover:bg-primary-600 text-white"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            )}
            {isEditing && !isNewStudent && (
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="info">Student Information</TabsTrigger>
          <TabsTrigger value="documents" disabled={isNewStudent}>Documents</TabsTrigger>
        </TabsList>
        
        <TabsContent value="info" className="animation-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-primary-500" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="student_id">Student ID</Label>
                      {isEditing ? (
                        <div className="flex items-center mt-1">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          <Input
                            id="student_id"
                            name="student_id"
                            value={student.student_id}
                            onChange={handleInputChange}
                            placeholder="Enter student ID"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center mt-1 p-2 bg-gray-50 rounded-md border border-gray-200">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{student.student_id || "—"}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="full_name">Full Name</Label>
                      {isEditing ? (
                        <div className="flex items-center mt-1">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          <Input
                            id="full_name"
                            name="full_name"
                            value={student.full_name}
                            onChange={handleInputChange}
                            placeholder="Enter full name"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center mt-1 p-2 bg-gray-50 rounded-md border border-gray-200">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{student.full_name || "—"}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      {isEditing ? (
                        <div className="flex gap-4 mt-1">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="gender"
                              value="male"
                              checked={student.gender === 'male'}
                              onChange={handleInputChange}
                              className="mr-2"
                            />
                            Male
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="gender"
                              value="female"
                              checked={student.gender === 'female'}
                              onChange={handleInputChange}
                              className="mr-2"
                            />
                            Female
                          </label>
                        </div>
                      ) : (
                        <div className="flex items-center mt-1 p-2 bg-gray-50 rounded-md border border-gray-200">
                          <span className="capitalize">{student.gender || "—"}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="phone_number">Phone Number</Label>
                      {isEditing ? (
                        <div className="flex items-center mt-1">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          <Input
                            id="phone_number"
                            name="phone_number"
                            value={student.phone_number || ''}
                            onChange={handleInputChange}
                            placeholder="Enter phone number"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center mt-1 p-2 bg-gray-50 rounded-md border border-gray-200">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{student.phone_number || "—"}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Academic Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary-500" />
                  Academic Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="department">Department</Label>
                      {isEditing ? (
                        <div className="flex items-center mt-1">
                          <BookOpen className="h-4 w-4 mr-2 text-gray-400" />
                          <Input
                            id="department"
                            name="department"
                            value={student.department}
                            onChange={handleInputChange}
                            placeholder="Enter department"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center mt-1 p-2 bg-gray-50 rounded-md border border-gray-200">
                          <BookOpen className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{student.department || "—"}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="academic_year">Academic Year</Label>
                      {isEditing ? (
                        <div className="flex items-center mt-1">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          <Input
                            id="academic_year"
                            name="academic_year"
                            value={student.academic_year}
                            onChange={handleInputChange}
                            placeholder="Enter academic year"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center mt-1 p-2 bg-gray-50 rounded-md border border-gray-200">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{student.academic_year || "—"}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="certificate_id">Certificate ID</Label>
                      {isEditing ? (
                        <div className="flex items-center mt-1">
                          <Award className="h-4 w-4 mr-2 text-gray-400" />
                          <Input
                            id="certificate_id"
                            name="certificate_id"
                            value={student.certificate_id || ''}
                            onChange={handleInputChange}
                            placeholder="Enter certificate ID"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center mt-1 p-2 bg-gray-50 rounded-md border border-gray-200">
                          <Award className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{student.certificate_id || "—"}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Academic Performance */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary-500" />
                  Academic Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="gpa">GPA</Label>
                      {isEditing ? (
                        <div className="flex items-center mt-1">
                          <GraduationCap className="h-4 w-4 mr-2 text-gray-400" />
                          <Input
                            id="gpa"
                            name="gpa"
                            type="number"
                            step="0.1"
                            min="0"
                            max="4"
                            value={student.gpa}
                            onChange={handleInputChange}
                            placeholder="Enter GPA"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center mt-1 p-2 bg-gray-50 rounded-md border border-gray-200">
                          <GraduationCap className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{student.gpa || "—"}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="grade">Grade</Label>
                      {isEditing ? (
                        <div className="flex items-center mt-1">
                          <Award className="h-4 w-4 mr-2 text-gray-400" />
                          <Input
                            id="grade"
                            name="grade"
                            value={student.grade}
                            onChange={handleInputChange}
                            placeholder="Enter grade"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center mt-1 p-2 bg-gray-50 rounded-md border border-gray-200">
                          <Award className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{student.grade || "—"}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dates */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary-500" />
                  Important Dates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="admission_date">Admission Date</Label>
                      {isEditing ? (
                        <div className="flex items-center mt-1">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          <Input
                            id="admission_date"
                            name="admission_date"
                            type="date"
                            value={student.admission_date 
                              ? new Date(student.admission_date).toISOString().split('T')[0] 
                              : ''
                            }
                            onChange={handleInputChange}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center mt-1 p-2 bg-gray-50 rounded-md border border-gray-200">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          <span>
                            {student.admission_date 
                              ? new Date(student.admission_date).toLocaleDateString() 
                              : "—"
                            }
                          </span>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="graduation_date">Graduation Date</Label>
                      {isEditing ? (
                        <div className="flex items-center mt-1">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          <Input
                            id="graduation_date"
                            name="graduation_date"
                            type="date"
                            value={student.graduation_date 
                              ? new Date(student.graduation_date).toISOString().split('T')[0] 
                              : ''
                            }
                            onChange={handleInputChange}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center mt-1 p-2 bg-gray-50 rounded-md border border-gray-200">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          <span>
                            {student.graduation_date 
                              ? new Date(student.graduation_date).toLocaleDateString() 
                              : "—"
                            }
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="status">Status</Label>
                      {isEditing ? (
                        <div className="flex gap-4 mt-1">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="status"
                              value="cleared"
                              checked={student.status === 'cleared'}
                              onChange={handleInputChange}
                              className="mr-2"
                            />
                            <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                            Cleared
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="status"
                              value="un-cleared"
                              checked={student.status === 'un-cleared'}
                              onChange={handleInputChange}
                              className="mr-2"
                            />
                            <AlertCircle className="h-4 w-4 mr-1 text-yellow-500" />
                            Uncleared
                          </label>
                        </div>
                      ) : (
                        <div className="flex items-center mt-1 p-2 bg-gray-50 rounded-md border border-gray-200">
                          {student.status === 'cleared' ? (
                            <div className="flex items-center">
                              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                              <span className="text-green-700">Cleared</span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <AlertCircle className="h-4 w-4 mr-2 text-yellow-500" />
                              <span className="text-yellow-700">Uncleared</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="documents" className="animation-fade-in">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary-500" />
                Student Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-4">
                  Upload and manage documents for this student.
                </p>
                
                <div className="flex items-center mb-6">
                  <label className="flex items-center">
                    <span className="bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-primary-600 transition-colors">
                      <Upload className="w-4 h-4 mr-2 inline-block" />
                      Upload Documents
                    </span>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                
                {documents.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>File Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead>Upload Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {documents.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell className="font-medium">{doc.file_name}</TableCell>
                            <TableCell>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {doc.document_type}
                              </span>
                            </TableCell>
                            <TableCell>{(doc.file_size / 1024).toFixed(2)} KB</TableCell>
                            <TableCell>{new Date(doc.upload_date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" asChild>
                                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                    <Eye className="h-4 w-4 mr-1" />
                                    View
                                  </a>
                                </Button>
                                <Button variant="outline" size="sm" asChild>
                                  <a href={doc.file_url} download={doc.file_name}>
                                    <Download className="h-4 w-4 mr-1" />
                                    Download
                                  </a>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="p-8 flex items-center justify-center border border-dashed border-gray-300 rounded-lg">
                    <div className="text-center">
                      <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 mb-2">No documents found</p>
                      <p className="text-sm text-gray-400">Upload documents for this student</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentDetail;
