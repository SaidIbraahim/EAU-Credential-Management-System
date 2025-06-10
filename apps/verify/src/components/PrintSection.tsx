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
    <div className="hidden print:block print-page">
      <div className="max-w-4xl mx-auto bg-white">
        {/* Enhanced Header with Logo and University Info */}
        <div className="print-header mb-6">
          <div className="flex items-center justify-center gap-4 mb-3">
            <LogoComponent className="w-20 h-20 object-contain" />
            <div className="text-center">
              <h1 className="text-xl font-bold text-[#2c2484] leading-tight">EAST AFRICA UNIVERSITY</h1>
              <h2 className="text-lg font-semibold text-[#2c2484] leading-tight">GAROWE CAMPUS</h2>
              <h3 className="text-base font-medium text-[#2c2484] leading-tight">Official Certificate Verification</h3>
            </div>
          </div>
          <div className="border-t-2 border-b-2 border-[#2c2484] py-2">
            <p className="text-center text-sm font-medium">This document confirms the authenticity of the certificate</p>
          </div>
        </div>

        {/* Verification Status */}
        <div className="text-center mb-6 p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-lg font-bold text-green-800">✓ CERTIFICATE VERIFIED SUCCESSFULLY</p>
          <p className="text-sm text-green-700">Verification Date: {formatDate(result.verificationDate)}</p>
        </div>

        {/* Student Photo and Basic Information Section */}
        <div className="flex items-start gap-6 mb-6">
          {/* Student Photo */}
          <div className="flex-shrink-0">
            <div className="w-32 h-32 bg-gray-100 border-2 border-gray-300 rounded overflow-hidden">
              <img
                src={getStudentPhoto()}
                alt={student.fullName}
                className="w-full h-full object-contain bg-white"
                onError={(e) => {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.fullName)}&size=200&background=2c2484&color=fff`;
                }}
              />
            </div>
            <div className="text-center mt-2">
              <p className="text-xs font-medium text-gray-600">STUDENT PHOTO</p>
            </div>
          </div>
          
          {/* Basic Student Information */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-[#2c2484] mb-3 break-words">
              {student.fullName}
            </h2>
            <div className="space-y-2">
              <div className="flex">
                <span className="font-semibold text-gray-700 w-32">Registration ID:</span>
                <span className="text-gray-900">{student.registrationId}</span>
              </div>
              {student.certificateId && (
                <div className="flex">
                  <span className="font-semibold text-gray-700 w-32">Certificate No:</span>
                  <span className="text-red-600 font-bold">{student.certificateId}</span>
                </div>
              )}
              <div className="flex">
                <span className="font-semibold text-gray-700 w-32">Gender:</span>
                <span className="text-gray-900">{formatGender(student.gender)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Academic Information Table */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-[#2c2484] mb-3 flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
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
        <div className="border-t-2 border-gray-400 pt-4">
          <div className="flex justify-between items-start">
            {/* Verification Info */}
            <div className="flex-1">
              <h4 className="font-bold text-[#2c2484] mb-2">Verification Details:</h4>
              <div className="space-y-1 text-sm">
                <p><span className="font-semibold">Status:</span> Authentic & Verified</p>
                <p><span className="font-semibold">Verification Date:</span> {formatDate(result.verificationDate)}</p>
                <p><span className="font-semibold">Institution:</span> East Africa University - Garowe Campus</p>
              </div>
            </div>
            
            {/* Official Seal */}
            <div className="text-center border-2 border-[#2c2484] p-4 bg-gray-50">
              <div className="w-16 h-16 bg-[#2c2484] text-white rounded-full flex items-center justify-center mx-auto mb-2">
                <GraduationCap className="w-8 h-8" />
              </div>
              <p className="text-xs font-bold text-[#2c2484]">OFFICIAL SEAL</p>
              <p className="text-xs font-semibold text-[#2c2484]">EAU GAROWE</p>
              <p className="text-xs text-gray-600 mt-1">{new Date().getFullYear()}</p>
            </div>
          </div>
          
          {/* Footer Information */}
          <div className="text-center text-sm text-gray-600 mt-6 pt-4 border-t border-gray-300">
            <p className="font-medium mb-1">This verification is electronically generated and valid without signature.</p>
            <p>For verification inquiries, contact: registrar@eaugarowe.edu.so</p>
            <p>Visit: www.eaugarowe.edu.so | Certificate Verification Portal: https://eau-verify.vercel.app</p>
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
    <tr className="hover:bg-gray-50">
      <td className="py-2 px-3 text-left w-1/3 border border-gray-400 bg-gray-50 font-semibold text-sm">
        {label}:
      </td>
      <td className="py-2 px-3 border border-gray-400 text-sm">
        {value}
      </td>
    </tr>
  );
};

export default PrintSection; 