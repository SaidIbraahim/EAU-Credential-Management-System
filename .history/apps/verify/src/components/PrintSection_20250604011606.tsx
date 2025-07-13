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

  const formatStatus = (status: string) => {
    return status === 'CLEARED' ? 'Cleared' : status === 'UN_CLEARED' ? 'Un-Cleared' : status;
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
                <svg class="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
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
    <div className="hidden print:block">
      {/* Print Header */}
      <div className="print-header mb-6">
        <div className="flex justify-center mb-4">
          <LogoComponent className="w-20 h-20" />
        </div>
        <h1 className="text-2xl font-bold text-center text-[#2c2484]">EAST AFRICA UNIVERSITY</h1>
        <h2 className="text-lg font-semibold text-center text-[#2c2484]">GAROWE CAMPUS</h2>
        <h3 className="text-xl font-semibold text-center text-[#2c2484] mt-2">OFFICIAL CERTIFICATE VERIFICATION</h3>
        <div className="border-t-2 border-b-2 border-[#2c2484] my-4 py-2">
          <p className="text-center text-sm">This document is an official verification from East Africa University</p>
        </div>
      </div>

      {/* Student Photo */}
      <div className="flex justify-center mb-6">
        <img
          src={getStudentPhoto()}
          alt={student.fullName}
          className="h-28 w-28 object-cover border border-gray-300"
          onError={(e) => {
            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.fullName)}&size=200&background=2c2484&color=fff`;
          }}
        />
      </div>

      {/* Verification Details Table */}
      <table className="w-full border-collapse border border-gray-400 mb-6">
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
          <PrintRow label="Clearance Status" value={formatStatus(student.status)} />
        </tbody>
      </table>

      {/* Verification Footer */}
      <div className="mt-8 pt-4 border-t border-gray-400">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-semibold mb-2">Verification Details:</h4>
            <p className="text-sm">Verification Date: {formatDate(result.verificationDate)}</p>
            <p className="text-sm">Verification Status: ✓ Verified</p>
            <p className="text-sm mt-2">
              This document confirms the authenticity of the certificate and graduation details.
            </p>
          </div>
          <div className="text-right">
            <div className="border border-gray-400 p-3 bg-gray-50">
              <p className="text-xs font-semibold">OFFICIAL VERIFICATION SEAL</p>
              <p className="text-xs mt-1">East Africa University</p>
              <p className="text-xs">Garowe Campus</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Footer */}
      <div className="mt-8 pt-4 border-t border-gray-300">
        <div className="text-center">
          <p className="text-xs text-gray-600">
            This verification was generated electronically and is valid without signature.
          </p>
          <p className="text-xs text-gray-600 mt-1">
            For inquiries, contact: registrar@eaugarowe.edu.so | +252 90 XXX XXXX
          </p>
          <p className="text-xs text-gray-600 mt-1">
            East Africa University - Garowe Campus | www.eaugarowe.edu.so
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
      <td className="py-2 px-3 text-right w-1/2 border border-gray-400 bg-gray-50 font-medium">
        {label}:
      </td>
      <td className={`py-2 px-3 border border-gray-400 ${isHighlighted ? 'font-bold' : ''}`}>
        {value}
      </td>
    </tr>
  );
};

export default PrintSection; 