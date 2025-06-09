import React, { useState } from 'react';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { SearchSectionProps } from '../types';

const SearchSection: React.FC<SearchSectionProps> = ({ onSearch, isLoading, error }) => {
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    if (!input.trim()) {
      return;
    }
    onSearch(input.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="w-full mx-auto mb-6 sm:mb-8 no-print">
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-medium text-[#2c2484] mb-4 sm:mb-6">Verify Certificate</h2>
        
        <div className="flex flex-col gap-3 sm:gap-4">
          <input
            type="text"
            className="w-full px-4 py-3 sm:px-5 sm:py-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2c2484] focus:border-transparent text-sm sm:text-base transition-all duration-200"
            placeholder="Enter Certificate Number or Registration ID (e.g. GRW-BCS-2005)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          
          <button
            onClick={handleSubmit}
            disabled={isLoading || !input.trim()}
            className="w-full sm:w-auto sm:self-end px-6 py-3 sm:px-8 sm:py-4 bg-[#2c2484] text-white rounded-lg hover:bg-opacity-90 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm sm:text-base"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5" />
                <span className="hidden sm:inline">Verifying...</span>
                <span className="sm:hidden">Verifying</span>
              </>
            ) : (
              <>
                <Search className="h-5 w-5" />
                <span className="hidden sm:inline">Verify Now</span>
                <span className="sm:hidden">Verify</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 sm:p-4 bg-red-50 rounded-lg flex items-start gap-2 sm:gap-3 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm sm:text-base">{error}</p>
          </div>
        )}

        <InstructionsPanel />
      </div>
    </div>
  );
};

const InstructionsPanel: React.FC = () => {
  return (
    <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 rounded-lg">
      <p className="text-sm sm:text-base text-gray-700 font-semibold mb-2 sm:mb-3">Instructions:</p>
      
      <p className="text-sm sm:text-base text-gray-600 mb-2 sm:mb-3">You can verify a certificate using either:</p>
      
      <ul className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 space-y-1 sm:space-y-2 pl-2">
        <li className="flex items-start">
          <span className="mr-2 mt-1 w-1 h-1 bg-gray-400 rounded-full flex-shrink-0"></span>
          <span>A student Registration ID (e.g. GRW-BCS-2005 or grw-bcs-2005) - case insensitive</span>
        </li>
        <li className="flex items-start">
          <span className="mr-2 mt-1 w-1 h-1 bg-gray-400 rounded-full flex-shrink-0"></span>
          <span>A Certificate Number shown on the certificate (e.g. 1245)</span>
        </li>
      </ul>
      
      <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
        <span className="font-semibold">Note:</span> Only certificates from registered students can be verified through this portal.
      </p>
      
      <div className="border-t border-blue-100 pt-3 sm:pt-4 mt-3 sm:mt-4">
        <p className="text-sm sm:text-base text-gray-700 font-semibold mb-2 sm:mb-3">Institution Grading Policy:</p>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-x-4 sm:gap-x-8 gap-y-2 text-sm sm:text-base text-gray-600">
          <div className="flex items-center">
            <span className="font-medium mr-1 text-[#2c2484]">A:</span>
            <span>3.50 - 4.00</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium mr-1 text-[#2c2484]">B:</span>
            <span>3.00 - 3.49</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium mr-1 text-[#2c2484]">C:</span>
            <span>2.50 - 2.99</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium mr-1 text-[#2c2484]">D:</span>
            <span>2.00 - 2.49</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchSection; 