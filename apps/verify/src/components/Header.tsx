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
        <div className={`${className} bg-[#2c2484] text-white rounded-full flex items-center justify-center flex-shrink-0`}>
          <GraduationCap className="w-8 h-8 sm:w-10 md:w-12 lg:h-12" />
        </div>
      );
    }

    return (
      <img 
        src="/EAU-Logo.png" 
        alt="EAU Logo" 
        className={`${className} flex-shrink-0`}
        onError={() => setImageError(true)}
      />
    );
  };

  if (showPrintableHeader) {
    return (
      <div className="hidden print:block print-header">
        <div className="flex justify-center mb-4">
          <LogoComponent className="w-20 h-20 object-contain" />
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
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo and Title Section */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0">
            {/* Logo Container */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center flex-shrink-0">
              <LogoComponent className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 object-contain" />
            </div>
            
            {/* Text Content */}
            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white leading-tight">
                <span className="block sm:hidden">EAU - GAROWE</span>
                <span className="hidden sm:block md:hidden">EAST AFRICA UNIVERSITY</span>
                <span className="hidden md:block">EAST AFRICA UNIVERSITY - GAROWE CAMPUS</span>
              </h1>
              <p className="text-xs sm:text-sm text-blue-100 mt-0.5 truncate">
                Certificate Verification Portal
              </p>
            </div>
          </div>
          
          {/* Website Link */}
          <div className="flex-shrink-0">
            <a 
              href="https://eaugarowe.edu.so/" 
              className="px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2 bg-white text-[#2c2484] rounded-md hover:bg-opacity-90 transition-colors font-medium text-xs sm:text-sm whitespace-nowrap"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="hidden sm:inline">Visit Official Website</span>
              <span className="sm:hidden">Visit Site</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header; 