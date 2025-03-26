import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Save, Trash2, Upload, Download, User, Calendar, GraduationCap, 
  BookOpen, Phone, Award, CheckCircle, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Student, Document } from "@/types";
import { studentsApi, documentsApi, auditLogApi } from "@/api/apiClient";

const StudentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNewStudent = id === 'new';
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  
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
      
      navigate("/students");
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
  
  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Loading student data...</p>
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
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => navigate("/students")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h2 className="text-2xl font-bold tracking-tight">
            {isNewStudent ? "Register New Student" : `Student: ${student.full_name}`}
          </h2>
        </div>
        
        <div className="flex gap-2">
          {!isNewStudent && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
          <Button 
            className="bg-primary-500 hover:bg-primary-600 text-white"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="info">Student Information</TabsTrigger>
          <TabsTrigger value="documents" disabled={isNewStudent}>Documents</TabsTrigger>
        </TabsList>
        
        <TabsContent value="info" className="animation-fade-in">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="student_id">Student ID</Label>
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
                </div>
                
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
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
                </div>
                
                <div>
                  <Label htmlFor="gender">Gender</Label>
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
                </div>
                
                <div>
                  <Label htmlFor="phone_number">Phone Number</Label>
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
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="department">Department</Label>
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
                </div>
                
                <div>
                  <Label htmlFor="academic_year">Academic Year</Label>
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
                </div>
                
                <div>
                  <Label htmlFor="certificate_id">Certificate ID</Label>
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
                </div>
                
                <div>
                  <Label htmlFor="gpa">GPA</Label>
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
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="grade">Grade</Label>
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
                </div>
                
                <div>
                  <Label htmlFor="admission_date">Admission Date</Label>
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
                </div>
                
                <div>
                  <Label htmlFor="graduation_date">Graduation Date</Label>
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
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="status">Status</Label>
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
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="documents" className="animation-fade-in">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Student Documents</h3>
              <p className="text-sm text-gray-500">
                Upload and manage documents for this student.
              </p>
              
              <div className="mt-4 flex items-center">
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
            </div>
            
            {documents.length > 0 ? (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          File Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Size
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Upload Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {documents.map((doc) => (
                        <tr key={doc.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {doc.file_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {doc.document_type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {(doc.file_size / 1024).toFixed(2)} KB
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {doc.upload_date.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <Button variant="ghost" size="sm" asChild>
                              <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </a>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-6 flex items-center justify-center border border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <p className="text-gray-500 mb-2">No documents found</p>
                  <p className="text-sm text-gray-400">Upload documents for this student</p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentDetail;
