
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, Upload, Filter, PlusCircle } from "lucide-react";
import { Student } from "@/types";

const Students = () => {
  const [activeTab, setActiveTab] = useState("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [importedStudents, setImportedStudents] = useState<Student[]>([]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'csv' | 'zip') => {
    if (e.target.files && e.target.files[0]) {
      if (fileType === 'csv') {
        setCsvFile(e.target.files[0]);
      } else {
        setZipFile(e.target.files[0]);
      }
    }
  };
  
  const handleImport = () => {
    // In a real app, this would process the files and extract data
    // For now, we'll just simulate a successful import
    if (csvFile) {
      // Simulate imported students (mock data)
      const mockStudents = [
        {
          id: 1,
          student_id: "STU001",
          full_name: "John Smith",
          gender: "male" as const,
          phone_number: "+1234567890",
          department: "Computer Science",
          academic_year: "2023-2024",
          gpa: 3.8,
          grade: "A",
          admission_date: new Date("2020-09-01"),
          status: "cleared" as const,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          student_id: "STU002",
          full_name: "Jane Doe",
          gender: "female" as const,
          phone_number: "+0987654321",
          department: "Mathematics",
          academic_year: "2023-2024",
          gpa: 3.9,
          grade: "A",
          admission_date: new Date("2020-09-01"),
          status: "cleared" as const,
          created_at: new Date(),
          updated_at: new Date(),
        }
      ];
      
      setImportedStudents(mockStudents);
    }
  };
  
  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto w-full animation-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Students</h2>
        <Button className="bg-primary-500 hover:bg-primary-600 text-white">
          <PlusCircle className="mr-2 h-4 w-4" />
          Register Student
        </Button>
      </div>
      
      <Tabs defaultValue="list" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="list">Student List</TabsTrigger>
          <TabsTrigger value="import">Bulk Import</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="animation-fade-in">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="p-6 min-h-80 flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-500 mb-2">No students found</p>
                <p className="text-sm text-gray-400">Add students or import them from a CSV file</p>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="import" className="animation-fade-in">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Import Student Data</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Upload a CSV file containing student information. The file should include columns for Full Name, Student ID, Gender, Phone Number, Department, Academic Year, GPA, Grade, Admission Date, Graduation Date, and Status.
                </p>
                
                <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="mx-auto h-10 w-10 text-gray-400 mb-4" />
                  <p className="text-sm text-gray-500 mb-2">
                    Drag and drop your CSV file here, or click to browse
                  </p>
                  <label className="inline-block">
                    <span className="bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-primary-600 transition-colors">
                      Browse Files
                    </span>
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, 'csv')}
                    />
                  </label>
                  {csvFile && (
                    <p className="mt-2 text-sm text-gray-600">
                      Selected: {csvFile.name}
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Import Student Documents</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Upload a ZIP file containing photos, transcripts, certificates, and supporting documents for students. The ZIP structure should match the student IDs in the CSV file.
                </p>
                
                <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="mx-auto h-10 w-10 text-gray-400 mb-4" />
                  <p className="text-sm text-gray-500 mb-2">
                    Drag and drop your ZIP file here, or click to browse
                  </p>
                  <label className="inline-block">
                    <span className="bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-primary-600 transition-colors">
                      Browse Files
                    </span>
                    <input
                      type="file"
                      accept=".zip"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, 'zip')}
                    />
                  </label>
                  {zipFile && (
                    <p className="mt-2 text-sm text-gray-600">
                      Selected: {zipFile.name}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  className="bg-primary-500 hover:bg-primary-600 text-white"
                  disabled={!csvFile}
                  onClick={handleImport}
                >
                  Import Data
                </Button>
              </div>
              
              {importedStudents.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-4">Preview Imported Data</h3>
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Full Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Gender
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Department
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            GPA
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {importedStudents.map((student) => (
                          <tr key={student.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {student.student_id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {student.full_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {student.gender}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {student.department}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {student.gpa}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                student.status === 'cleared' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {student.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <Button variant="outline" className="mr-2">
                      Cancel
                    </Button>
                    <Button className="bg-primary-500 hover:bg-primary-600 text-white">
                      Confirm Import
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Students;
