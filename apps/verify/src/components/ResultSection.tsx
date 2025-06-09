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
    <div className="w-full mx-auto bg-white rounded-lg shadow-sm overflow-hidden mb-6 sm:mb-8">
      {/* Header with Print Button */}
      <div className="flex items-center justify-between p-3 sm:p-4 bg-green-50 border-b border-green-200">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          <h3 className="font-medium text-green-800 text-sm sm:text-base truncate">
            <span className="hidden sm:inline">Certificate Verified Successfully</span>
            <span className="sm:hidden">Verified Successfully</span>
          </h3>
        </div>
        <button
          onClick={onPrint}
          className="flex items-center gap-1 sm:gap-2 bg-[#09c] text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-opacity-90 transition-colors no-print flex-shrink-0"
        >
          <Printer className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Print Verification</span>
          <span className="sm:hidden">Print</span>
        </button>
      </div>
      
      {/* Main Content */}
      <div className="p-0">
        {/* Student Photo Section */}
        <div className="flex justify-center items-center py-4 sm:py-6 border-b border-gray-200 bg-gray-50">
          <div className="relative">
            <img
              src={getStudentPhoto()}
              alt={student.fullName}
              className="h-24 w-24 sm:h-32 sm:w-32 object-cover rounded-lg border-2 border-white shadow-lg"
              onError={(e) => {
                // Fallback to default avatar if image fails to load
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.fullName)}&size=200&background=2c2484&color=fff`;
              }}
            />
            <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-green-500 text-white rounded-full p-1">
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
          </div>
        </div>
        
        {/* Student Information */}
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
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
            label="Grade" 
            value={student.grade || '—'} 
          />
        </div>

        {/* Verification Footer */}
        <div className="p-3 sm:p-4 bg-gray-50 border-t border-gray-200">
          <div className="text-center text-sm text-gray-600">
            <p className="font-medium mb-1">This certificate has been verified</p>
            <p className="text-xs sm:text-sm">Verification Date: {formatDate(result.verificationDate)}</p>
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
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
      <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-gray-500 flex-shrink-0">{icon}</span>
          <span className="font-medium text-[#20396b] text-sm sm:text-base">{label}</span>
        </div>
      </div>
      <div className="px-3 py-2">
        <span className={`text-sm sm:text-base ${isHighlighted ? 'text-[#d30000] font-bold' : 'text-gray-900'} break-words`}>
          {value}
        </span>
      </div>
    </div>
  );
};

export default ResultSection; 