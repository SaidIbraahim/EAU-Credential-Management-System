import React, { useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { PrintSectionProps } from '../types';

const PrintSection: React.FC<PrintSectionProps> = ({ result }) => {
  const { student } = result;

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatGender = (gender: string) => {
    return gender === 'MALE' ? 'M' : gender === 'FEMALE' ? 'F' : gender;
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
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(student.fullName)}&size=120&background=2c2484&color=fff`;
  };

  const LogoComponent = ({ className }: { className: string }) => {
    const [imageError, setImageError] = useState(false);

    if (imageError) {
      return (
        <div className={`${className} bg-[#2c2484] text-white rounded-full flex items-center justify-center`}>
          <GraduationCap className="w-8 h-8" />
        </div>
      );
    }

    return (
      <img 
        src="/EAU-logo.png" 
        alt="EAU Logo" 
        className={className}
        onError={() => setImageError(true)}
      />
    );
  };

  return (
    <div className="hidden print:block print-page">
      {/* Minimal Print Header */}
      <div className="print-header mb-2">
        <div className="flex items-center justify-center gap-2 mb-1">
          <LogoComponent className="w-10 h-10" />
          <div className="text-center">
            <h1 className="text-sm font-bold text-[#2c2484] leading-tight">EAST AFRICA UNIVERSITY - GAROWE</h1>
            <h2 className="text-xs font-semibold text-[#2c2484] leading-tight">CERTIFICATE VERIFICATION</h2>
          </div>
        </div>
      </div>

      {/* Extremely Compact Content */}
      <div className="flex gap-3 mb-2">
        {/* Photo */}
        <div className="flex-shrink-0">
          <img
            src={getStudentPhoto()}
            alt={student.fullName}
            className="h-16 w-16 object-cover border border-gray-300"
            onError={(e) => {
              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.fullName)}&size=120&background=2c2484&color=fff`;
            }}
          />
        </div>

        {/* Details Table */}
        <div className="flex-1">
          <table className="w-full border-collapse border border-gray-400 text-xs">
            <tbody>
              <PrintRow label="Cert #" value={student.certificateId || '—'} isHighlighted />
              <PrintRow label="Reg #" value={student.registrationId} />
              <PrintRow label="Name" value={student.fullName} />
              <PrintRow label="Gender" value={formatGender(student.gender)} />
              <PrintRow label="Faculty" value={student.faculty?.name || '—'} />
              <PrintRow label="Department" value={student.department?.name || '—'} />
              <PrintRow label="Year" value={student.academicYear?.academicYear || '—'} />
              <PrintRow label="Graduation" value={formatDate(student.graduationDate || '')} />
              <PrintRow label="GPA" value={student.gpa ? `${student.gpa}/4.00` : '—'} />
              <PrintRow label="Grade" value={student.grade || '—'} />
            </tbody>
          </table>
        </div>
      </div>

      {/* Minimal Footer */}
      <div className="mt-2 pt-1 border-t border-gray-400">
        <div className="flex justify-between items-center text-xs">
          <div>
            <p><span className="font-semibold">Date:</span> {formatDate(result.verificationDate)}</p>
            <p><span className="font-semibold">Status:</span> ✓ Verified</p>
          </div>
          <div className="text-right">
            <div className="border border-gray-400 p-1 bg-gray-50">
              <p className="text-xs font-semibold">OFFICIAL</p>
              <p className="text-xs">EAU</p>
            </div>
          </div>
        </div>
        <div className="text-center text-xs text-gray-600 mt-1">
          <p>Electronic verification - registrar@eaugarowe.edu.so</p>
        </div>
      </div>
    </div>
  );
};

interface PrintRowProps {
  label: string;
  value: string;
  isHighlighted?: boolean;
}

const PrintRow: React.FC<PrintRowProps> = ({ label, value, isHighlighted }) => {
  return (
    <tr>
      <td className="py-0 px-1 text-right w-1/3 border border-gray-400 bg-gray-50 font-medium text-xs">
        {label}:
      </td>
      <td className={`py-0 px-1 border border-gray-400 text-xs ${isHighlighted ? 'font-bold' : ''}`}>
        {value}
      </td>
    </tr>
  );
};

export default PrintSection; 