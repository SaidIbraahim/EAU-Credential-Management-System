import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  User, 
  GraduationCap, 
  FileText, 
  Calendar, 
  Award,
  Phone,
  Mail,
  MapPin,
  Clock,
  Upload,
  Download,
  Eye,
  CheckCircle,
  AlertCircle,
  Edit,
  Save,
  X,
  Camera,
  FileIcon,
  Plus,
  Trash2,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { Student, Document } from "@/types";
import { studentsApi, documentsApi, auditLogApi, cleanupObjectUrls, facultiesApi, departmentsApi, academicYearsApi } from "@/api/apiClient";
import { useOptimizedData, clearCachePattern } from "@/hooks/useOptimizedData";
import { useDataContext } from "@/contexts/DataContext";
import StudentDetailModals from "@/components/students/StudentDetailModals";
import StudentDetailSkeleton from "@/components/ui/StudentDetailSkeleton";

const StudentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isNewStudent] = useState(!id || id === 'new');
  
  // Modal states
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Data context
  const { faculties, departments, academicYears } = useDataContext();
  
  // Optimized data fetching
  const { 
    data: facultiesData, 
    isLoading: facultiesLoading 
  } = useOptimizedData(facultiesApi.getAll, { 
    cacheKey: 'faculties',
    cacheExpiry: 5 * 60 * 1000 
  });

  const { 
    data: departmentsData, 
    isLoading: departmentsLoading 
  } = useOptimizedData(departmentsApi.getAll, { 
    cacheKey: 'departments',
    cacheExpiry: 5 * 60 * 1000 
  });

  const { 
    data: academicYearsData, 
    isLoading: academicYearsLoading 
  } = useOptimizedData(academicYearsApi.getAll, { 
    cacheKey: 'academicYears',
    cacheExpiry: 5 * 60 * 1000 
  });

  // Use context data or fallback to optimized data
  const activeFaculties = faculties || facultiesData || [];
  const activeDepartments = departments || departmentsData || [];
  const activeAcademicYears = academicYears || academicYearsData || [];

  // Debug logging
  console.log('🔍 Active data arrays:', {
    faculties: activeFaculties.length,
    departments: activeDepartments.length,
    academicYears: activeAcademicYears.length
  });

  if (student && isEditing) {
    console.log('🔍 Student in edit mode:', {
      facultyId: student.facultyId,
      departmentId: student.departmentId,
      academicYearId: student.academicYearId,
      foundFaculty: activeFaculties.find(f => f.id === student.facultyId),
      foundDepartment: activeDepartments.find(d => d.id === student.departmentId),
      foundAcademicYear: activeAcademicYears.find(y => y.id === student.academicYearId)
    });
  }

  // Previous object URLs for cleanup
  const previousObjectUrls = useRef<string[]>([]);

  // Load student data
  useEffect(() => {
    // Clear cache to ensure fresh data with new backend changes
    clearCachePattern(['students']);
    
    const loadStudent = async () => {
      if (isNewStudent) {
      setStudent({
        id: 0,
          registrationId: '',
          certificateId: '',
          fullName: '',
          gender: 'MALE' as const,
          phone: '',
          facultyId: 0,
          departmentId: 0,
          academicYearId: 0,
        gpa: 0,
        grade: '',
          graduationDate: '',
          status: 'UN_CLEARED' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        setIsEditing(true);
      setIsLoading(false);
        return;
    }
  
    try {
        setIsLoading(true);
        const studentData = await studentsApi.getById(parseInt(id!));
        console.log('🔍 Loaded student data:', studentData);
        console.log('🔍 Student IDs:', {
          departmentId: studentData.departmentId,
          facultyId: studentData.facultyId,
          academicYearId: studentData.academicYearId
        });
        setStudent(studentData);
        
        // Load documents for existing student using registration ID
        if (studentData.registrationId) {
          await loadDocuments(studentData.registrationId);
      }
    } catch (error) {
        console.error('Error loading student:', error);
        toast.error('Failed to load student details');
    } finally {
        setIsLoading(false);
      }
    };

    loadStudent();
  }, [id, isNewStudent]);

  // Load documents using registration ID
  const loadDocuments = useCallback(async (registrationId: string) => {
    if (isNewStudent || !registrationId) return;
    
    try {
      setDocumentsLoading(true);
      
      // Cleanup previous object URLs
      previousObjectUrls.current.forEach(url => {
        cleanupObjectUrls([url]);
      });
      previousObjectUrls.current = [];

      console.log('Loading documents for registration ID:', registrationId);
      const docs = await documentsApi.getByStudentId(registrationId);
      console.log('Loaded documents:', docs);
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Failed to load student documents');
    } finally {
      setDocumentsLoading(false);
    }
  }, [isNewStudent]);

  // Handle input changes
  const handleInputChange = useCallback((field: string, value: any) => {
    setStudent(prev => prev ? { ...prev, [field]: value } : null);
  }, []);

  // Handle save
  const handleSave = async () => {
    if (!student) return;
    
    try {
      setIsSaving(true);
      let savedStudent;

      // Prepare data for API - ensure proper types and remove unwanted fields
      const studentData = {
        registrationId: student.registrationId,
        certificateId: student.certificateId || undefined,
        fullName: student.fullName,
        gender: student.gender,
        phone: student.phone || undefined,
        departmentId: Number(student.departmentId),
        facultyId: Number(student.facultyId),
        academicYearId: Number(student.academicYearId),
        gpa: student.gpa ? Number(student.gpa) : undefined,
        grade: student.grade || undefined,
        graduationDate: student.graduationDate || undefined,
        status: student.status || 'UN_CLEARED'
      };

      console.log('Saving student data:', studentData);

      if (isNewStudent) {
        savedStudent = await studentsApi.create(studentData);
        await auditLogApi.logAction('Added Student', 'STUDENT', savedStudent.id, 
          `Added new student: ${student.fullName}`);
        toast.success('Student registered successfully!');
        navigate(`/students/${savedStudent.id}`);
      } else {
        savedStudent = await studentsApi.update(student.id.toString(), studentData);
        await auditLogApi.logAction('Updated Student', 'STUDENT', student.id, 
          `Updated student: ${student.fullName}`);
        toast.success('Student updated successfully!');
      }

      setStudent(savedStudent);
      setIsEditing(false);
      
      // Clear relevant cache
      clearCachePattern(['students']);
    } catch (error: any) {
      console.error('Error saving student:', error);
      console.error('Error details:', error.response?.data);
      
      // Better error handling
      let errorMessage = 'Failed to save student';
      if (error.response?.data?.error) {
        if (Array.isArray(error.response.data.error)) {
          // Zod validation errors
          errorMessage = error.response.data.error.map((e: any) => `${e.path?.join('.')}: ${e.message}`).join(', ');
        } else if (typeof error.response.data.error === 'string') {
          errorMessage = error.response.data.error;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };
  
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (isNewStudent) {
      navigate('/students');
    } else {
      // Reset student data if canceling edit
      if (id) {
        studentsApi.getById(parseInt(id)).then(setStudent);
      }
    }
  };

  const handleNavigateBack = () => {
    navigate('/students');
  };

  const handleFileUpload = async (files: File[], type: 'photo' | 'transcript' | 'certificate' | 'supporting') => {
    if (!student || isNewStudent || !student.registrationId) {
      toast.error('Student registration ID is required for document upload');
      return;
    }

    try {
      // Create FormData with all files at once to match backend expectation
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append('files', file); // Use 'files' to match backend upload.array('files')
      });
      
      console.log('Uploading documents:', { 
        registrationId: student.registrationId, 
        type: type.toUpperCase(), 
        fileCount: files.length,
        fileNames: files.map(f => f.name),
        formDataKeys: Array.from(formData.keys())
      });
      
      const uploadResult = await documentsApi.upload(student.registrationId, type.toUpperCase(), formData);
      console.log('Upload result:', uploadResult);
      
      // Reload documents using registration ID and force refresh
      console.log('Upload successful, reloading documents...');
      await loadDocuments(student.registrationId);
      
      // Clear cache to ensure fresh data
      clearCachePattern(['documents', 'students']);
      
      toast.success(`${files.length} document(s) uploaded successfully`);
      setIsUploadModalOpen(false);
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast.error(error.response?.data?.message || 'Failed to upload document');
    }
  };

  const handleDeleteDocument = async (documentId: number) => {
    try {
      await documentsApi.delete(documentId.toString());
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      toast.success('Document deleted successfully');
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast.error(error.response?.data?.message || 'Failed to delete document');
    }
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!student || isNewStudent) return;

    try {
      await studentsApi.delete(student.id);
      await auditLogApi.logAction('Deleted Student', 'STUDENT', student.id, 
        `Deleted student: ${student.fullName}`);
      
      // Cleanup object URLs
      previousObjectUrls.current.forEach(url => {
        cleanupObjectUrls([url]);
      });
      
      // Clear relevant cache
      clearCachePattern(['students']);
      
      toast.success('Student deleted successfully');
      navigate('/students');
    } catch (error: any) {
      console.error('Error deleting student:', error);
      toast.error(error.response?.data?.message || 'Failed to delete student');
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  // Document viewing functions
  const handleViewDocument = (document: Document) => {
    const url = document.presignedUrl || document.fileUrl;
    if (url) {
      window.open(url, '_blank');
    } else {
      toast.error('Document URL not available');
    }
  };

  const handleDownloadDocument = async (document: Document) => {
    try {
      const response = await fetch(`/api/documents/${document.id}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          const link = window.document.createElement('a');
          link.href = data.url;
          link.download = document.fileName || 'document';
          link.target = '_blank';
          window.document.body.appendChild(link);
          link.click();
          window.document.body.removeChild(link);
        } else {
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          const link = window.document.createElement('a');
          link.href = blobUrl;
          link.download = document.fileName || 'document';
          window.document.body.appendChild(link);
          link.click();
          window.document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        }
      } else {
        throw new Error(`Download failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      const url = document.presignedUrl || document.fileUrl;
      if (url) {
        window.open(url, '_blank');
      }
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'PHOTO': return <Camera className="h-4 w-4" />;
      case 'TRANSCRIPT': return <FileText className="h-4 w-4" />;
      case 'CERTIFICATE': return <Award className="h-4 w-4" />;
      case 'SUPPORTING': return <FileIcon className="h-4 w-4" />;
      default: return <FileIcon className="h-4 w-4" />;
    }
  };

  const getDocumentColor = (type: string) => {
    switch (type) {
      case 'PHOTO': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'TRANSCRIPT': return 'bg-green-50 text-green-700 border-green-200';
      case 'CERTIFICATE': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'SUPPORTING': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };
  
  if (isLoading) {
    return <StudentDetailSkeleton isNewStudent={isNewStudent} />;
  }
  
  if (!student) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Student Not Found
          </CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-gray-600 mb-4">
              The requested student could not be found.
            </p>
            <Button onClick={handleNavigateBack} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Students
                </Button>
        </CardContent>
      </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={handleNavigateBack} size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Students
            </Button>
              <Separator orientation="vertical" className="h-5" />
            <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {isNewStudent ? "Register New Student" : student.fullName}
                </h1>
              {!isNewStudent && (
                  <div className="flex items-center gap-3 mt-0.5">
                    <p className="text-xs text-gray-600">ID: {student.registrationId}</p>
                    <Badge variant={student.status === 'CLEARED' ? 'default' : 'secondary'} className="text-xs px-2 py-0.5">
                      {student.status === 'CLEARED' ? 'Cleared' : 'Un-Cleared'}
                    </Badge>
              </div>
            )}
              </div>
          </div>
          
            <div className="flex items-center gap-2">
              {isEditing ? (
          <div className="flex gap-2">
              <Button 
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancel
              </Button>
              <Button 
                    size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                    <Save className="h-3 w-3 mr-1" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
                </div>
              ) : (
                !isNewStudent && (
                  <Button size="sm" onClick={toggleEditMode}>
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
              </Button>
                )
            )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content - Full Width Layout */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="space-y-4">
          
          {/* Personal Information */}
          <Card className="shadow-sm">
              <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" />
                  Personal Information
                </CardTitle>
              </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="fullName" className="text-xs font-medium">Full Name</Label>
                      {isEditing ? (
                          <Input
                      id="fullName"
                      value={student.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <p className="text-sm font-medium">{student.fullName || 'N/A'}</p>
                      )}
                    </div>

                <div className="space-y-1">
                  <Label htmlFor="registrationId" className="text-xs font-medium">Registration ID</Label>
                      {isEditing ? (
                          <Input
                      id="registrationId"
                      value={student.registrationId}
                      onChange={(e) => handleInputChange('registrationId', e.target.value)}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <p className="text-sm">{student.registrationId || 'N/A'}</p>
                      )}
                    </div>

                <div className="space-y-1">
                  <Label htmlFor="gender" className="text-xs font-medium">Gender</Label>
                      {isEditing ? (
                    <Select
                      value={student.gender}
                      onValueChange={(value) => handleInputChange('gender', value)}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm">{student.gender || 'N/A'}</p>
                      )}
                    </div>

                <div className="space-y-1">
                  <Label htmlFor="phone" className="text-xs font-medium">Phone</Label>
                      {isEditing ? (
                    <Input
                      id="phone"
                      value={student.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <p className="text-sm">{student.phone || 'N/A'}</p>
                      )}
                    </div>

                <div className="space-y-1">
                  <Label htmlFor="certificateId" className="text-xs font-medium">Certificate ID</Label>
                      {isEditing ? (
                          <Input
                      id="certificateId"
                      value={student.certificateId}
                      onChange={(e) => handleInputChange('certificateId', e.target.value)}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <p className="text-sm">{student.certificateId || 'N/A'}</p>
                  )}
                        </div>
                
                <div className="space-y-1">
                  <Label htmlFor="status" className="text-xs font-medium">Status</Label>
                  {isEditing ? (
                    <Select
                      value={student.status}
                      onValueChange={(value) => handleInputChange('status', value)}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CLEARED">Cleared</SelectItem>
                        <SelectItem value="UN_CLEARED">Un-Cleared</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant={student.status === 'CLEARED' ? 'default' : 'secondary'} className="text-xs">
                      {student.status === 'CLEARED' ? 'Cleared' : 'Un-Cleared'}
                    </Badge>
                  )}
                  </div>
                </div>
              </CardContent>
            </Card>

          {/* Academic Information */}
          <Card className="shadow-sm">
              <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-green-600" />
                  Academic Information
                </CardTitle>
              </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="faculty" className="text-xs font-medium">Faculty</Label>
                      {isEditing ? (
                    <Select
                      value={student.facultyId?.toString() || ""}
                      onValueChange={(value) => handleInputChange('facultyId', parseInt(value))}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue>
                          {student.facultyId ? 
                            activeFaculties.find(f => f.id === student.facultyId)?.name || "Select faculty" : 
                            "Select faculty"
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {activeFaculties.map((faculty) => (
                          <SelectItem key={faculty.id} value={faculty.id.toString()}>
                            {faculty.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm">
                      {activeFaculties.find(f => f.id === student.facultyId)?.name || 'N/A'}
                    </p>
                      )}
                    </div>
                    
                <div className="space-y-1">
                  <Label htmlFor="department" className="text-xs font-medium">Department</Label>
                      {isEditing ? (
                    <Select
                      value={student.departmentId?.toString() || ""}
                      onValueChange={(value) => handleInputChange('departmentId', parseInt(value))}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue>
                          {student.departmentId ? 
                            activeDepartments.find(d => d.id === student.departmentId)?.name || "Select department" : 
                            "Select department"
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {activeDepartments.map((department) => (
                          <SelectItem key={department.id} value={department.id.toString()}>
                            {department.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm">
                      {activeDepartments.find(d => d.id === student.departmentId)?.name || 'N/A'}
                    </p>
                      )}
                    </div>

                <div className="space-y-1">
                  <Label htmlFor="academicYear" className="text-xs font-medium">Academic Year</Label>
                      {isEditing ? (
                    <Select
                      value={student.academicYearId?.toString() || ""}
                      onValueChange={(value) => handleInputChange('academicYearId', parseInt(value))}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue>
                          {student.academicYearId ? 
                            activeAcademicYears.find(y => y.id === student.academicYearId)?.academicYear || "Select year" : 
                            "Select year"
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {activeAcademicYears.map((year) => (
                          <SelectItem key={year.id} value={year.id.toString()}>
                            {year.academicYear}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm">
                      {activeAcademicYears.find(y => y.id === student.academicYearId)?.academicYear || 'N/A'}
                    </p>
                      )}
                    </div>
                
                <div className="space-y-1">
                  <Label htmlFor="gpa" className="text-xs font-medium">GPA</Label>
                      {isEditing ? (
                        <div className="space-y-2">
                          <Input
                            id="gpa"
                            type="number"
                            step="0.01"
                            min="0"
                            max="4"
                            value={student.gpa}
                            onChange={(e) => {
                              const gpaVal = parseFloat(e.target.value);
                              handleInputChange('gpa', gpaVal);
                              
                              // Automatically calculate and set grade based on GPA
                              if (!isNaN(gpaVal) && gpaVal >= 0 && gpaVal <= 4) {
                                const calculatedGrade = gpaVal >= 3.5 ? 'A' : 
                                                       gpaVal >= 3.0 ? 'B' : 
                                                       gpaVal >= 2.5 ? 'C' : 
                                                       gpaVal >= 2.0 ? 'D' : 'F';
                                handleInputChange('grade', calculatedGrade);
                              }
                            }}
                            className="h-8 text-sm"
                          />
                          {student.gpa && student.gpa >= 0 && student.gpa <= 4 && (
                            <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded-md">
                              <strong>Auto-calculated Grade:</strong> {
                                student.gpa >= 3.5 ? 'A (3.50 - 4.00)' : 
                                student.gpa >= 3.0 ? 'B (3.00 - 3.49)' : 
                                student.gpa >= 2.5 ? 'C (2.50 - 2.99)' : 
                                student.gpa >= 2.0 ? 'D (2.00 - 2.49)' : 'F (Below 2.00)'
                              }
                            </div>
                          )}
                        </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{student.gpa || 'N/A'}/4.0</p>
                      {student.gpa && (
                        <Badge variant={student.gpa >= 3.5 ? 'default' : 'secondary'} className="text-xs">
                          {student.gpa >= 3.5 ? 'Excellent' : student.gpa >= 3.0 ? 'Good' : 'Average'}
                        </Badge>
                      )}
                        </div>
                      )}
                    </div>

                <div className="space-y-1">
                  <Label htmlFor="grade" className="text-xs font-medium">Grade</Label>
                      {isEditing ? (
                        <div className="space-y-2">
                          <Input
                            id="grade"
                            value={student.grade}
                            onChange={(e) => handleInputChange('grade', e.target.value)}
                            className="h-8 text-sm"
                          />
                          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded-md">
                            <strong>Grading Policy:</strong> A (3.50-4.00) | B (3.00-3.49) | C (2.50-2.99) | D (2.00-2.49) | F (Below 2.00)
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="text-sm">{student.grade || 'N/A'}</p>
                          {student.grade && student.gpa && (
                            <Badge variant="outline" className="text-xs">
                              {student.gpa >= 3.5 ? '3.50-4.00' : 
                               student.gpa >= 3.0 ? '3.00-3.49' : 
                               student.gpa >= 2.5 ? '2.50-2.99' : 
                               student.gpa >= 2.0 ? '2.00-2.49' : 'Below 2.00'}
                            </Badge>
                          )}
                        </div>
                  )}
                        </div>
                
                <div className="space-y-1">
                  <Label htmlFor="graduationDate" className="text-xs font-medium">Graduation Date</Label>
                  {isEditing ? (
                    <Input
                      id="graduationDate"
                      type="date"
                      value={student.graduationDate ? student.graduationDate.split('T')[0] : ''}
                      onChange={(e) => handleInputChange('graduationDate', e.target.value)}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <p className="text-sm">
                      {student.graduationDate ? new Date(student.graduationDate).toLocaleDateString() : 'N/A'}
                    </p>
                  )}
                  </div>
                </div>
              </CardContent>
            </Card>

          {/* Documents Section */}
          {!isNewStudent && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-purple-600" />
                    Documents ({documents.length})
                </CardTitle>
                  <Button
                    size="sm"
                    onClick={() => setIsUploadModalOpen(true)}
                    className="h-7 text-xs"
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    Upload
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {documentsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No documents uploaded yet</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsUploadModalOpen(true)}
                      className="mt-3 h-7 text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Upload First Document
                    </Button>
                        </div>
                      ) : (
                  <div className="space-y-4">
                    {/* Document Summary */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                      {[
                        { type: 'PHOTO', label: 'Photos', count: documents.filter(d => d.documentType === 'PHOTO').length },
                        { type: 'TRANSCRIPT', label: 'Transcripts', count: documents.filter(d => d.documentType === 'TRANSCRIPT').length },
                        { type: 'CERTIFICATE', label: 'Certificates', count: documents.filter(d => d.documentType === 'CERTIFICATE').length },
                        { type: 'SUPPORTING', label: 'Supporting', count: documents.filter(d => d.documentType === 'SUPPORTING').length }
                      ].map((item) => (
                        <div key={item.type} className={`text-center p-4 rounded-lg border ${getDocumentColor(item.type)}`}>
                          <div className="text-2xl font-bold">{item.count}</div>
                          <div className="text-sm">{item.label}</div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Document List */}
                    <div className="space-y-2">
                      {documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`p-2 rounded ${getDocumentColor(doc.documentType)}`}>
                              {getDocumentIcon(doc.documentType)}
                        </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{doc.fileName}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Badge variant="outline" className={`text-xs ${getDocumentColor(doc.documentType)}`}>
                                  {doc.documentType}
                                </Badge>
                                <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                                {doc.fileSize && (
                                  <span>• {(doc.fileSize / 1024).toFixed(2)} KB</span>
                                )}
                            </div>
                            </div>
                        </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewDocument(doc)}
                              className="h-8 w-8 p-0"
                              title="View document"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDownloadDocument(doc)}
                              className="h-8 w-8 p-0"
                              title="Download document"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              title="Delete document"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                    </div>
                  </div>
                      ))}
                </div>

                    {documents.length > 6 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsDocumentModalOpen(true)}
                        className="w-full h-8 text-xs"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View All Documents
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
          </div>
          
      {/* Modals */}
      <StudentDetailModals
        isDocumentModalOpen={isDocumentModalOpen}
        isUploadModalOpen={isUploadModalOpen}
        isDeleteDialogOpen={isDeleteDialogOpen}
        documents={documents}
        onDocumentModalChange={setIsDocumentModalOpen}
        onUploadModalChange={setIsUploadModalOpen}
        onDeleteDialogChange={setIsDeleteDialogOpen}
        onFileUpload={handleFileUpload}
        onDeleteDocument={handleDeleteDocument}
        onDeleteStudent={handleDelete}
        studentName={student?.fullName || ''}
      />
    </div>
  );
};

export default StudentDetail;