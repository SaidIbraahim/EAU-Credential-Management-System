import { Student } from "@/types";
import { useDataContext } from "@/contexts/DataContext";

interface StudentPreviewTableProps {
  students: Student[];
  duplicates?: Student[];
}

const StudentPreviewTable = ({ students, duplicates = [] }: StudentPreviewTableProps) => {
  const { departments, faculties, academicYears } = useDataContext();
  
  console.log('🔍 StudentPreviewTable received:', {
    studentsCount: students.length,
    firstStudent: students[0],
    departmentsCount: departments?.length,
    facultiesCount: faculties?.length,
    academicYearsCount: academicYears?.length
  });
  
  if (students.length === 0) return null;

  // Helper functions to get names from IDs
  const getDepartmentName = (id: number) => departments?.find(d => d.id === id)?.name || `Dept: ${id}`;
  const getFacultyName = (id: number) => faculties?.find(f => f.id === id)?.name || `Faculty: ${id}`;
  const getAcademicYearName = (id: number) => academicYears?.find(ay => ay.id === id)?.academicYear || `AY: ${id}`;

  // Check if a student is a duplicate
  const isDuplicate = (student: Student) => 
    duplicates.some(dup => dup.registrationId === student.registrationId);

  const duplicateCount = students.filter(isDuplicate).length;
  const validCount = students.length - duplicateCount;

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-md font-medium text-gray-900">
          Preview Data ({students.length} total)
        </h3>
        <div className="flex items-center gap-4 text-sm">
          {validCount > 0 && (
            <span className="text-green-600 font-medium">
              ✓ {validCount} new
            </span>
          )}
          {duplicateCount > 0 && (
            <span className="text-red-600 font-medium">
              ⚠ {duplicateCount} duplicates
            </span>
          )}
        </div>
      </div>
      
      <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
        <div className="overflow-x-auto max-h-96">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registration No
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Full Name
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Faculty
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Academic Year
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student, index) => {
                const duplicate = isDuplicate(student);
                return (
                  <tr 
                    key={student.id || `student-${index}`} 
                    className={`${
                      duplicate 
                        ? 'bg-red-50 border-l-4 border-l-red-400' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${
                      duplicate ? 'text-red-900' : 'text-gray-900'
                    }`}>
                      <div className="flex items-center">
                        {duplicate && (
                          <span className="mr-2 text-red-500" title="Duplicate student">
                            ⚠
                          </span>
                        )}
                        {student.registrationId}
                      </div>
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap text-sm ${
                      duplicate ? 'text-red-700' : 'text-gray-700'
                    }`}>
                      {student.fullName}
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap text-sm ${
                      duplicate ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {getDepartmentName(student.departmentId)}
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap text-sm ${
                      duplicate ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {getFacultyName(student.facultyId)}
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap text-sm ${
                      duplicate ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {getAcademicYearName(student.academicYearId)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {duplicate ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Duplicate
                        </span>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          student.status === 'CLEARED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {student.status === 'CLEARED' ? 'Cleared' : 'Un-cleared'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {duplicateCount > 0 && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <span className="text-red-500 mr-2">⚠</span>
            <p className="text-sm text-red-800">
              <strong>{duplicateCount}</strong> duplicate record{duplicateCount !== 1 ? 's' : ''} found. 
              These will be skipped during import.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPreviewTable;
