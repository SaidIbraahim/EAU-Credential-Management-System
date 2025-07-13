import React from 'react';
import { GraduationCap } from 'lucide-react';

interface HeaderProps {
  showPrintableHeader?: boolean;
}

const Header: React.FC<HeaderProps> = ({ showPrintableHeader = false }) => {
  const LogoComponent = ({ className, showFallback = false }: { className: string, showFallback?: boolean }) => {
    if (showFallback) {
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