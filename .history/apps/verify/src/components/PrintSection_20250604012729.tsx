import React from 'react';
import { GraduationCap } from 'lucide-react';
import { PrintSectionProps } from '../types';

const PrintSection: React.FC<PrintSectionProps> = ({ result }) => {
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

  const LogoComponent = ({ className }: { className: string }) => {
    return (
      <img 
        src="https://i.ibb.co/Jk8FPx1/logo.png" 
        alt="EAU Logo" 
        className={className}
        onError={(e) => {
          // Replace with fallback icon on error
          const target = e.target as HTMLImageElement;
          const parent = target.parentElement;
          if (parent) {
            parent.innerHTML = `
              <div class="${className} bg-[#2c2484] text-white rounded-full flex items-center justify-center">
                <svg class="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
                </svg>
              </div>
            `;
          }
        }}
      />
    );
  };

  return (
    <div className="hidden print:block print-page">
      {/* Compact Print Header */}
      <div className="print-header mb-4">
        <div className="flex items-center justify-center gap-4 mb-3">
          <LogoComponent className="w-16 h-16" />
          <div className="text-center">
            <h1 className="text-xl font-bold text-[#2c2484] leading-tight">EAST AFRICA UNIVERSITY</h1>
            <h2 className="text-lg font-semibold text-[#2c2484] leading-tight">GAROWE CAMPUS</h2>
            <h3 className="text-lg font-semibold text-[#2c2484] mt-1">CERTIFICATE VERIFICATION</h3>
          </div>
        </div>
        <div className="border-t border-b border-[#2c2484] py-2">
          <p className="text-center text-sm">Official verification from East Africa University</p>
        </div>
      </div>

      {/* Main Content Layout - Two Columns */}
      <div className="flex gap-6 mb-4">
        {/* Left: Student Photo */}
        <div className="flex-shrink-0">
          <img
            src={getStudentPhoto()}
            alt={student.fullName}
            className="h-24 w-24 object-cover border border-gray-300"
            onError={(e) => {
              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.fullName)}&size=200&background=2c2484&color=fff`;
            }}
          />
        </div>

        {/* Right: Student Details Table */}
        <div className="flex-1">
          <table className="w-full border-collapse border border-gray-400 text-sm">
            <tbody>
              <PrintRow label="Certificate Number" value={student.certificateId || '—'} isHighlighted />
              <PrintRow label="Registration Number" value={student.registrationId} />
              <PrintRow label="Full Name" value={student.fullName} />
              <PrintRow label="Gender" value={formatGender(student.gender)} />
              <PrintRow label="Faculty" value={student.faculty?.name || '—'} />
              <PrintRow label="Department" value={student.department?.name || '—'} />
              <PrintRow label="Academic Year" value={student.academicYear?.academicYear || '—'} />
              <PrintRow label="Graduation Date" value={formatDate(student.graduationDate || '')} />
              <PrintRow label="GPA" value={student.gpa ? `${student.gpa}/4.00` : '—'} />
              <PrintRow label="Letter Grade" value={student.grade || '—'} />
            </tbody>
          </table>
        </div>
      </div>

      {/* Compact Verification Footer */}
      <div className="mt-6 pt-3 border-t border-gray-400">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-semibold text-sm mb-1">Verification Details:</h4>
            <p className="text-xs">Date: {formatDate(result.verificationDate)}</p>
            <p className="text-xs">Status: ✓ Verified & Authentic</p>
          </div>
          <div className="text-right">
            <div className="border border-gray-400 p-2 bg-gray-50">
              <p className="text-xs font-semibold">OFFICIAL SEAL</p>
              <p className="text-xs">EAU Garowe</p>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Print Footer */}
      <div className="mt-4 pt-3 border-t border-gray-300">
        <div className="text-center">
          <p className="text-xs text-gray-600">
            This verification is electronically generated and valid without signature.
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Contact: registrar@eaugarowe.edu.so | www.eaugarowe.edu.so
          </p>
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
      <td className="py-1 px-2 text-right w-2/5 border border-gray-400 bg-gray-50 font-medium text-xs">
        {label}:
      </td>
      <td className={`py-1 px-2 border border-gray-400 text-xs ${isHighlighted ? 'font-bold' : ''}`}>
        {value}
      </td>
    </tr>
  );
};

export default PrintSection; 