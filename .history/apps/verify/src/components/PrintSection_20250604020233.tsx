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
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(student.fullName)}&size=100&background=2c2484&color=fff`;
  };

  const LogoComponent = ({ className }: { className: string }) => {
    const [imageError, setImageError] = useState(false);

    if (imageError) {
      return (
        <div className={`${className} bg-[#2c2484] text-white rounded-full flex items-center justify-center`}>
          <GraduationCap className="w-6 h-6" />
        </div>
      );
    }

    return (
      <img 
        src="/EAU-Logo.png" 
        alt="EAU Logo" 
        className={className}
        onError={() => setImageError(true)}
      />
    );
  };

  return (
    <div className="hidden print:block print-page">
      {/* Compact Header with Logo and University Info */}
      <div className="print-header mb-3">
        <div className="flex items-center justify-center gap-3 mb-2">
          <LogoComponent className="w-12 h-12 object-contain" />
          <div className="text-center">
            <h1 className="text-base font-bold text-[#2c2484] leading-tight">EAST AFRICA UNIVERSITY</h1>
            <h2 className="text-sm font-semibold text-[#2c2484] leading-tight">GAROWE CAMPUS</h2>
            <h3 className="text-sm font-medium text-[#2c2484] leading-tight">Certificate Verification</h3>
          </div>
        </div>
        <div className="border-t border-b border-[#2c2484] py-1">
          <p className="text-center text-xs">Official Verification from East Africa University</p>
        </div>
      </div>

      {/* Main Content: Student Photo and Details Side by Side */}
      <div className="flex gap-4 mb-3">
        {/* Student Photo */}
        <div className="flex-shrink-0">
          <img
            src={getStudentPhoto()}
            alt={student.fullName}
            className="h-16 w-16 object-cover border border-gray-300"
            onError={(e) => {
              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.fullName)}&size=100&background=2c2484&color=fff`;
            }}
          />
        </div>

        {/* Student Details Table */}
        <div className="flex-1">
          <table className="w-full border-collapse border border-gray-400 text-xs">
            <tbody>
              <PrintRow label="Certificate #" value={student.certificateId || '—'} isHighlighted />
              <PrintRow label="Registration #" value={student.registrationId} />
              <PrintRow label="Name" value={student.fullName} />
              <PrintRow label="Gender" value={formatGender(student.gender)} />
              <PrintRow label="Faculty" value={student.faculty?.name || '—'} />
              <PrintRow label="Department" value={student.department?.name || '—'} />
              <PrintRow label="Academic Year" value={student.academicYear?.academicYear || '—'} />
              <PrintRow label="Graduation" value={formatDate(student.graduationDate || '')} />
              <PrintRow label="GPA" value={student.gpa ? `${student.gpa}/4.00` : '—'} />
              <PrintRow label="Grade" value={student.grade || '—'} />
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification Footer */}
      <div className="mt-3 pt-2 border-t border-gray-400">
        <div className="flex justify-between items-center text-xs">
          <div>
            <p><span className="font-semibold">Verification Date:</span> {formatDate(result.verificationDate)}</p>
            <p><span className="font-semibold">Status:</span> ✓ Authentic & Verified</p>
          </div>
          <div className="text-right">
            <div className="border border-gray-400 p-2 bg-gray-50">
              <p className="text-xs font-semibold">OFFICIAL SEAL</p>
              <p className="text-xs">EAU GAROWE</p>
            </div>
          </div>
        </div>
        
        {/* Contact Information */}
        <div className="text-center text-xs text-gray-600 mt-2">
          <p>This verification is electronically generated and valid without signature.</p>
          <p>Contact: registrar@eaugarowe.edu.so | www.eaugarowe.edu.so</p>
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
      <td className="py-0.5 px-2 text-right w-1/3 border border-gray-400 bg-gray-50 font-medium text-xs">
        {label}:
      </td>
      <td className={`py-0.5 px-2 border border-gray-400 text-xs ${isHighlighted ? 'font-bold text-red-600' : ''}`}>
        {value}
      </td>
    </tr>
  );
};

export default PrintSection; 