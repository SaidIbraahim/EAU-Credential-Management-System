
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Save, Trash2, Upload, Download, User, Calendar, GraduationCap, 
  BookOpen, Phone, Award, CheckCircle, AlertCircle, FileText, Edit, Eye,
  FileImage, File as FileIcon, ImageIcon, BookIcon, ScrollIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Student, Document } from "@/types";
import { studentsApi, documentsApi, auditLogApi } from "@/api/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DocumentViewModal from "@/components/students/DocumentViewModal";
import DocumentUploadModal from "@/components/students/DocumentUploadModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const StudentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNewStudent = id === 'new';
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isEditing, setIsEditing] = useState(isNewStudent);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  useEffect(() => {
    if (!isNewStudent && id) {
      fetchStudentData(id);
    } else {
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
        await studentsApi.create(student);
        auditLogApi.logAction("Student Added", `Added student '${student.full_name}' with ID '${student.student_id}'`);
        toast.success("Student created successfully");
      } else {
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
    
    try {
      await studentsApi.delete(id);
      auditLogApi.logAction("Student Deleted", `Removed student '${student.full_name}' with ID '${student.student_id}'`);
      toast.success("Student deleted successfully");
      navigate("/students");
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.error("Error deleting student");
    }
  };
  
  const handleDocumentUpload = async (files: File[], documentType: 'photo' | 'transcript' | 'certificate' | 'supporting') => {
    if (!id || isNewStudent || files.length === 0) return;
    
    try {
      const uploadedDocs = await documentsApi.upload(id, files, documentType);
      setDocuments([...documents, ...uploadedDocs]);
      
      auditLogApi.logAction("Document Uploaded", `Uploaded ${files.length} ${documentType} document(s) for student with ID '${student?.student_id}'`);
      toast.success(`${files.length} ${documentType} document(s) uploaded successfully`);
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Error uploading documents");
    }
  };

  const handleDeleteDocument = async (documentId: number) => {
    if (!id) return;
    
    try {
      await documentsApi.deleteDocument(documentId.toString());
      setDocuments(documents.filter(doc => doc.id !== documentId));
      toast.success("Document deleted successfully");
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Error deleting document");
    }
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };
  
  // Count documents by type
  const getDocumentCountByType = (type: 'photo' | 'transcript' | 'certificate' | 'supporting') => {
    return documents.filter(doc => doc.document_type === type).length;
  };

  // Get document type icon
  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'photo':
        return <ImageIcon className="h-5 w-5 text-blue-500" />;
      case 'transcript':
        return <ScrollIcon className="h-5 w-5 text-amber-500" />;
      case 'certificate':
        return <Award className="h-5 w-5 text-green-500" />;
      case 'supporting':
      default:
        return <FileIcon className="h-5 w-5 text-purple-500" />;
    }
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
              <Button 
                variant="destructive" 
                onClick={() => setIsDeleteDialogOpen(true)}
              >
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
        <TabsList className="grid w-full grid-cols-1 mb-6">
          <TabsTrigger value="info">Student Information</TabsTrigger>
        </TabsList>
        
        <TabsContent value="info" className="animation-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          
          {!isNewStudent && (
            <Card className="mt-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary-500" />
                  Student Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-base font-medium">Documents and Attachments</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {documents.length} document{documents.length !== 1 ? 's' : ''} uploaded
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsDocumentModalOpen(true)}
                        className="bg-white"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View All
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button className="bg-primary-500 hover:bg-primary-600 text-white">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setIsUploadModalOpen(true)}>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload with Type Selection
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  {documents.length > 0 ? (
                    <div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                        <div className="flex flex-col items-center p-3 bg-white rounded-lg border border-gray-200">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                            <ImageIcon className="h-5 w-5 text-blue-500" />
                          </div>
                          <p className="text-sm font-medium">Photos</p>
                          <p className="text-lg font-bold">{getDocumentCountByType('photo')}</p>
                        </div>
                        <div className="flex flex-col items-center p-3 bg-white rounded-lg border border-gray-200">
                          <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center mb-2">
                            <ScrollIcon className="h-5 w-5 text-amber-500" />
                          </div>
                          <p className="text-sm font-medium">Transcripts</p>
                          <p className="text-lg font-bold">{getDocumentCountByType('transcript')}</p>
                        </div>
                        <div className="flex flex-col items-center p-3 bg-white rounded-lg border border-gray-200">
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mb-2">
                            <Award className="h-5 w-5 text-green-500" />
                          </div>
                          <p className="text-sm font-medium">Certificates</p>
                          <p className="text-lg font-bold">{getDocumentCountByType('certificate')}</p>
                        </div>
                        <div className="flex flex-col items-center p-3 bg-white rounded-lg border border-gray-200">
                          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mb-2">
                            <FileIcon className="h-5 w-5 text-purple-500" />
                          </div>
                          <p className="text-sm font-medium">Supporting</p>
                          <p className="text-lg font-bold">{getDocumentCountByType('supporting')}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {documents.slice(0, 3).map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                            <div className="flex items-center space-x-3 truncate">
                              <div className="flex-shrink-0">
                                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                  {getDocumentTypeIcon(doc.document_type)}
                                </div>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {doc.file_name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {(doc.file_size / 1024).toFixed(2)} KB • {new Date(doc.upload_date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <a 
                              href={doc.file_url} 
                              download={doc.file_name}
                              className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-500"
                            >
                              <Download className="h-5 w-5" />
                            </a>
                          </div>
                        ))}
                        
                        {documents.length > 3 && (
                          <div 
                            className="flex items-center justify-center p-3 bg-white rounded-lg border border-gray-200 border-dashed cursor-pointer hover:bg-gray-50"
                            onClick={() => setIsDocumentModalOpen(true)}
                          >
                            <span className="text-primary-500 font-medium">
                              +{documents.length - 3} more documents
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6">
                      <FileText className="h-12 w-12 text-gray-300 mb-3" />
                      <p className="text-gray-500 mb-2">No documents uploaded yet</p>
                      <p className="text-sm text-gray-400">Upload student documents using the button above</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      <DocumentViewModal 
        open={isDocumentModalOpen} 
        onOpenChange={setIsDocumentModalOpen}
        documents={documents}
        onDeleteDocument={handleDeleteDocument}
      />
      
      <DocumentUploadModal
        open={isUploadModalOpen}
        onOpenChange={setIsUploadModalOpen}
        onUpload={handleDocumentUpload}
      />
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {student.full_name}'s record and all associated documents.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StudentDetail;
