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
        src="/EAU-Logo.png" 
        alt="EAU Logo" 
        className={className}
        onError={() => setImageError(true)}
      />
    );
  };

  return (
    <div className="hidden print:block print-page mobile-print-ready">
      <div className="max-w-4xl mx-auto bg-white">
        {/* Enhanced Header with Logo and University Info */}
        <div className="print-header mb-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <LogoComponent className="w-16 h-16 object-contain" />
            <div className="text-center">
              <h1 className="text-lg font-bold text-[#2c2484] leading-tight">EAST AFRICA UNIVERSITY</h1>
              <h2 className="text-base font-semibold text-[#2c2484] leading-tight">GAROWE CAMPUS</h2>
              <h3 className="text-sm font-medium text-[#2c2484] leading-tight">Official Certificate Verification</h3>
            </div>
          </div>
          <div className="border-t border-b border-[#2c2484] py-1">
            <p className="text-center text-xs font-medium">This document confirms the authenticity of the certificate</p>
          </div>
        </div>

        {/* Verification Status */}
        <div className="text-center mb-4 p-2 border border-green-200 rounded">
          <p className="text-base font-bold text-green-800">✓ CERTIFICATE VERIFIED SUCCESSFULLY</p>
          <p className="text-xs text-green-700">Verification Date: {formatDate(result.verificationDate)}</p>
        </div>

        {/* Student Photo and Basic Information Section */}
        <div className="flex items-start gap-4 mb-4">
          {/* Student Photo */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 border border-gray-300 rounded overflow-hidden">
              <img
                src={getStudentPhoto()}
                alt={student.fullName}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.fullName)}&size=200&background=2c2484&color=fff`;
                }}
              />
            </div>
            <div className="text-center mt-1">
              <p className="text-xs font-medium text-gray-600">STUDENT PHOTO</p>
            </div>
          </div>
          
          {/* Basic Student Information */}
          <div className="flex-1">
            <h2 className="text-lg font-bold text-[#2c2484] mb-2 break-words">
              {student.fullName}
            </h2>
            <div className="space-y-1">
              <div className="flex">
                <span className="font-semibold text-gray-700 w-28 text-xs">Registration ID:</span>
                <span className="text-gray-900 text-xs">{student.registrationId}</span>
              </div>
              {student.certificateId && (
                <div className="flex">
                  <span className="font-semibold text-gray-700 w-28 text-xs">Certificate No:</span>
                  <span className="text-red-600 font-bold text-xs">{student.certificateId}</span>
                </div>
              )}
              <div className="flex">
                <span className="font-semibold text-gray-700 w-28 text-xs">Gender:</span>
                <span className="text-gray-900 text-xs">{formatGender(student.gender)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Academic Information Table */}
        <div className="mb-4 bg-gray-50 rounded-lg p-3">
          <h3 className="text-sm font-bold text-[#2c2484] mb-2 flex items-center gap-1">
            <GraduationCap className="w-4 h-4" />
            Academic Information
          </h3>
          
          <table className="w-full border-collapse border border-gray-400">
            <tbody>
              <PrintRow label="Faculty" value={student.faculty?.name || '—'} />
              <PrintRow label="Department" value={student.department?.name || '—'} />
              <PrintRow label="Academic Year" value={student.academicYear?.academicYear || '—'} />
              <PrintRow label="Graduation Date" value={formatDate(student.graduationDate || '')} />
              <PrintRow label="GPA" value={student.gpa ? `${student.gpa}/4.00` : '—'} />
              <PrintRow label="Grade" value={student.grade || '—'} />
            </tbody>
          </table>
        </div>

        {/* Verification Details and Footer */}
        <div className="border-t border-gray-400 pt-2">
          <div className="flex justify-between items-start">
            {/* Verification Info */}
            <div className="flex-1">
              <h4 className="font-bold text-[#2c2484] mb-1 text-xs">Verification Details:</h4>
              <div className="space-y-0 text-xs">
                <p><span className="font-semibold">Status:</span> Authentic & Verified</p>
                <p><span className="font-semibold">Date:</span> {formatDate(result.verificationDate)}</p>
                <p><span className="font-semibold">Institution:</span> East Africa University - Garowe Campus</p>
              </div>
            </div>
            
            {/* Official Seal */}
            <div className="text-center border border-[#2c2484] p-2">
              <div className="w-12 h-12 bg-[#2c2484] text-white rounded-full flex items-center justify-center mx-auto mb-1">
                <GraduationCap className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-[#2c2484]">OFFICIAL SEAL</p>
              <p className="text-xs font-semibold text-[#2c2484]">EAU GAROWE</p>
              <p className="text-xs text-gray-600">{new Date().getFullYear()}</p>
            </div>
          </div>
          
          {/* Footer Information - Compact */}
          <div className="text-center text-xs text-gray-600 mt-3 pt-2 border-t border-gray-300">
            <p className="font-medium mb-1">This verification is electronically generated and valid without signature.</p>
            <p className="mb-0">Contact: registrar@eaugarowe.edu.so | www.eaugarowe.edu.so</p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface PrintRowProps {
  label: string;
  value: string;
}

const PrintRow: React.FC<PrintRowProps> = ({ label, value }) => {
  return (
    <tr>
      <td className="py-2 px-3 text-left w-1/3 border border-gray-400 font-semibold text-sm">
        {label}:
      </td>
      <td className="py-2 px-3 border border-gray-400 text-sm">
        {value}
      </td>
    </tr>
  );
};

export default PrintSection; 