import React, { useState } from 'react';
import { GraduationCap } from 'lucide-react';

interface HeaderProps {
  showPrintableHeader?: boolean;
}

const Header: React.FC<HeaderProps> = ({ showPrintableHeader = false }) => {
  const LogoComponent = ({ className, showFallback = false }: { className: string, showFallback?: boolean }) => {
    const [imageError, setImageError] = useState(false);

    if (showFallback || imageError) {
      return (
        <div className={`${className} bg-[#2c2484] text-white rounded-full flex items-center justify-center`}>
          <GraduationCap className="w-12 h-12" />
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

  if (showPrintableHeader) {
    return (
      <div className="hidden print:block print-header">
        <div className="flex justify-center mb-4">
          <LogoComponent className="w-20 h-20" />
        </div>
        <h1 className="text-2xl font-bold text-center text-[#2c2484]">EAU GAROWE CAMPUS</h1>
        <h2 className="text-xl font-semibold text-center text-[#2c2484] mt-2">OFFICIAL CERTIFICATE VERIFICATION</h2>
        <div className="border-t-2 border-b-2 border-[#2c2484] my-4 py-2">
          <p className="text-center text-sm">This document is an official verification from East Africa University</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#2c2484] shadow-sm no-print">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
              <LogoComponent className="w-12 h-12" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">EAST AFRICA UNIVERSITY - GAROWE CAMPUS</h1>
              <p className="text-sm text-blue-100">Certificate Verification Portal</p>
            </div>
          </div>
          <a 
            href="https://eaugarowe.edu.so/" 
            className="px-4 py-2 bg-white text-[#2c2484] rounded-md hover:bg-opacity-90 transition-colors font-medium"
            target="_blank"
            rel="noopener noreferrer"
          >
            University Website
          </a>
        </div>
      </div>
    </div>
  );
};

export default Header; 