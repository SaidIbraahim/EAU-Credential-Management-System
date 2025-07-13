import React from 'react';
import { Printer, CheckCircle, User, GraduationCap, Calendar, Award } from 'lucide-react';
import { ResultSectionProps } from '../types';

const ResultSection: React.FC<ResultSectionProps> = ({ result, onPrint }) => {
  if (!result) {
    return null;
  }

  const { student } = result;

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatGender = (gender: string) => {
    return gender === 'MALE' ? 'Male' : gender === 'FEMALE' ? 'Female' : gender;
  };

  const getStudentPhoto = () => {
    // Try to find a photo document
    const photoDoc = student.documents?.find(doc => 
      doc.documentType.toUpperCase() === 'PHOTO'
    );
    
    if (photoDoc?.presignedUrl) {
      return photoDoc.presignedUrl;
    }
    
    // Fallback to a default avatar
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(student.fullName)}&size=200&background=2c2484&color=fff`;
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden mb-8">
      {/* Header with Print Button */}
      <div className="flex items-center justify-between p-4 bg-green-50 border-b border-green-200">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <h3 className="font-medium text-green-800">Certificate Verified Successfully</h3>
        </div>
        <button
          onClick={onPrint}
          className="flex items-center gap-2 bg-[#09c] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors no-print"
        >
          <Printer className="h-4 w-4" />
          Print Verification
        </button>
      </div>
      
      {/* Main Content */}
      <div className="p-0">
        {/* Student Photo Section */}
        <div className="flex justify-center items-center py-6 border-b border-gray-200 bg-gray-50">
          <div className="relative">
            <img
              src={getStudentPhoto()}
              alt={student.fullName}
              className="h-32 w-32 object-cover rounded-lg border-2 border-white shadow-lg"
              onError={(e) => {
                // Fallback to default avatar if image fails to load
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.fullName)}&size=200&background=2c2484&color=fff`;
              }}
            />
            <div className="absolute -bottom-2 -right-2 bg-green-500 text-white rounded-full p-1">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
        </div>
        
        {/* Student Information Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <tbody>
              <DataRow 
                icon={<Award className="h-4 w-4" />}
                label="Certificate Number" 
                value={student.certificateId || '—'} 
                isHighlighted 
              />
              <DataRow 
                icon={<User className="h-4 w-4" />}
                label="Registration Number" 
                value={student.registrationId} 
              />
              <DataRow 
                icon={<User className="h-4 w-4" />}
                label="Full Name" 
                value={student.fullName} 
              />
              <DataRow 
                icon={<User className="h-4 w-4" />}
                label="Gender" 
                value={formatGender(student.gender)} 
              />
              <DataRow 
                icon={<GraduationCap className="h-4 w-4" />}
                label="Faculty" 
                value={student.faculty?.name || '—'} 
              />
              <DataRow 
                icon={<GraduationCap className="h-4 w-4" />}
                label="Department" 
                value={student.department?.name || '—'} 
              />
              <DataRow 
                icon={<Calendar className="h-4 w-4" />}
                label="Academic Year" 
                value={student.academicYear?.academicYear || '—'} 
              />
              <DataRow 
                icon={<Calendar className="h-4 w-4" />}
                label="Graduation Date" 
                value={formatDate(student.graduationDate || '')} 
              />
              <DataRow 
                icon={<Award className="h-4 w-4" />}
                label="GPA" 
                value={student.gpa ? `${student.gpa}/4.00` : '—'} 
              />
              <DataRow 
                icon={<Award className="h-4 w-4" />}
                label="Letter Grade" 
                value={student.grade || '—'} 
              />
            </tbody>
          </table>
        </div>

        {/* Verification Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="text-center text-sm text-gray-600">
            <p className="font-medium mb-1">This certificate has been verified</p>
            <p>Verification Date: {formatDate(result.verificationDate)}</p>
            <p className="mt-2 text-xs">
              This verification is valid and confirms the authenticity of the certificate
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface DataRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  isHighlighted?: boolean;
}

const DataRow: React.FC<DataRowProps> = ({ icon, label, value, isHighlighted }) => {
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="py-3 px-4 text-right w-1/2 bg-gray-50 border-r border-gray-200">
        <div className="flex items-center justify-end gap-2">
          <span className="text-gray-500">{icon}</span>
          <span className="font-medium text-[#20396b]">{label}</span>
        </div>
      </td>
      <td className="py-3 px-4 border-r border-gray-200">
        <span className={`${isHighlighted ? 'text-[#d30000] font-bold' : ''}`}>
          {value}
        </span>
      </td>
    </tr>
  );
};

export default ResultSection; 