import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Student } from "@/types";

interface StudentTableProps {
  students: Student[];
  isLoading: boolean;
}

const StudentTable = ({ students, isLoading }: StudentTableProps) => {
  const navigate = useNavigate();
  
  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Loading students...</p>
      </div>
    );
  }
  
  if (students.length === 0) {
    return (
      <div className="p-6 min-h-80 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-2">No students found</p>
          <p className="text-sm text-gray-400">Try adjusting your filters or add new students</p>
        </div>
      </div>
    );
  }
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Registration No</TableHead>
          <TableHead>Full Name</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Faculty</TableHead>
          <TableHead>Academic Year</TableHead>
          <TableHead>GPA</TableHead>
          <TableHead>Grade</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((student) => (
          <TableRow key={student.id} className="hover:bg-gray-50 cursor-pointer" 
                  onClick={() => navigate(`/students/${student.id}`)}>
            <TableCell className="font-medium">{student.registrationId}</TableCell>
            <TableCell>{student.fullName}</TableCell>
            <TableCell>{student.department?.name || '-'}</TableCell>
            <TableCell>{student.faculty?.name || '-'}</TableCell>
            <TableCell>{student.academicYear?.academicYear || '-'}</TableCell>
            <TableCell>{student.gpa || '-'}</TableCell>
            <TableCell>{student.grade || '-'}</TableCell>
            <TableCell>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                student.status === 'CLEARED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {student.status === 'CLEARED' ? 'Cleared' : 'Un-Cleared'}
              </span>
            </TableCell>
            <TableCell>
              <Button variant="ghost" size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/students/${student.id}`);
                      }}>
                View
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default StudentTable;
