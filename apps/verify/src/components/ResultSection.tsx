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
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(student.fullName)}&size=300&background=2c2484&color=fff`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6 sm:mb-8 no-print">
      {/* Header with Print Button */}
      <div className="flex items-center justify-between p-4 sm:p-6 bg-green-50 border-b border-green-200">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
          <h3 className="font-semibold text-green-800 text-base sm:text-lg">
            <span className="hidden sm:inline">Certificate Verified Successfully</span>
            <span className="sm:hidden">Verified Successfully</span>
          </h3>
        </div>
        <button
          onClick={() => {
            console.log('Print button clicked');
            try {
              onPrint();
            } catch (error) {
              console.error('Print error:', error);
              // Direct fallback for mobile devices
              window.print();
            }
          }}
          className="flex items-center gap-2 bg-[#09c] text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg text-sm sm:text-base font-medium hover:bg-opacity-90 transition-colors no-print flex-shrink-0 shadow-sm"
          style={{ 
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'rgba(0, 0, 0, 0.1)',
            userSelect: 'none'
          }}
          type="button"
        >
          <Printer className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="hidden sm:inline">Print Verification</span>
          <span className="sm:hidden">Print</span>
        </button>
      </div>
      
      {/* Main Content */}
      <div className="p-4 sm:p-6">
        {/* Student Photo and Basic Info Section */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-6">
          {/* Student Photo */}
          <div className="relative flex-shrink-0">
            <div className="w-32 h-32 sm:w-40 sm:h-40 bg-gray-100 rounded-lg overflow-hidden border-2 border-white shadow-lg">
              <img
                src={getStudentPhoto()}
                alt={student.fullName}
                className="w-full h-full object-contain bg-white"
                onError={(e) => {
                  // Fallback to default avatar if image fails to load
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.fullName)}&size=300&background=2c2484&color=fff`;
                }}
              />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-green-500 text-white rounded-full p-1.5 shadow-sm">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          
          {/* Basic Student Information */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-[#2c2484] break-words">
              {student.fullName}
            </h2>
            <div className="space-y-1">
              <p className="text-sm sm:text-base text-gray-600">
                <span className="font-medium">Registration ID:</span> {student.registrationId}
              </p>
              {student.certificateId && (
                <p className="text-sm sm:text-base text-[#d30000] font-semibold">
                  <span className="text-gray-600 font-medium">Certificate No:</span> {student.certificateId}
                </p>
              )}
              <p className="text-sm sm:text-base text-gray-600">
                <span className="font-medium">Gender:</span> {formatGender(student.gender)}
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Information Table */}
        <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-[#2c2484] mb-4 flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Academic Information
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <tbody className="divide-y divide-gray-200">
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
              </tbody>
            </table>
          </div>
        </div>

        {/* Verification Footer */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <p className="font-semibold text-blue-800">Certificate Verification Complete</p>
            </div>
            <p className="text-sm text-blue-700 mb-1">
              Verification Date: {formatDate(result.verificationDate)}
            </p>
            <p className="text-xs text-blue-600">
              This verification confirms the authenticity of the certificate issued by East Africa University - Garowe Campus
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
}

const DataRow: React.FC<DataRowProps> = ({ icon, label, value }) => {
  return (
    <tr className="hover:bg-white transition-colors">
      <td className="py-3 px-4 text-left w-1/2">
        <div className="flex items-center gap-2">
          <span className="text-gray-500 flex-shrink-0">{icon}</span>
          <span className="font-medium text-[#20396b] text-sm sm:text-base">{label}</span>
        </div>
      </td>
      <td className="py-3 px-4 text-left">
        <span className="text-sm sm:text-base text-gray-900 font-medium">
          {value}
        </span>
      </td>
    </tr>
  );
};

export default ResultSection; 