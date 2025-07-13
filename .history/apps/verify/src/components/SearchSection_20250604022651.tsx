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
    <div className="max-w-2xl mx-auto mb-8 no-print">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-medium text-[#2c2484] mb-4">Verify Certificate</h2>
        
        <div className="flex flex-col gap-3">
          <input
            type="text"
            className="w-full px-5 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2c2484] focus:border-transparent text-sm md:text-base"
            placeholder="Enter Certificate Number or Registration ID (e.g. GRW-BCS-2005 or grw-bcs-2005)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          
          <button
            onClick={handleSubmit}
            disabled={isLoading || !input.trim()}
            className="w-full md:w-auto md:self-end px-5 py-3 bg-[#2c2484] text-white rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              <>
                <Search className="h-5 w-5" />
                Verify Now
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}

        <InstructionsPanel />
      </div>
    </div>
  );
};

const InstructionsPanel: React.FC = () => {
  return (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
      <p className="text-sm text-gray-600 font-semibold mb-2">Instructions:</p>
      
      <p className="text-sm text-gray-600 mb-2">You can verify a certificate using either:</p>
      
      <ul className="text-sm text-gray-600 mb-3 space-y-1">
        <li className="pl-2">• A student Registration ID (e.g. GRW-BCS-2005 or grw-bcs-2005) - case insensitive</li>
        <li className="pl-2">• A Certificate Number shown on the certificate (e.g. 1245)</li>
      </ul>
      
      <p className="text-sm text-gray-600 mb-3">
        <span className="font-semibold">Note:</span> Only certificates from registered students can be verified through this portal.
      </p>
      
      <div className="border-t border-blue-100 pt-3 mt-3">
        <p className="text-sm text-gray-600 font-semibold mb-2">Institution Grading Policy:</p>
        <div className="flex flex-wrap gap-x-8 gap-y-1 text-sm text-gray-600">
          <div className="flex items-center">
            <span className="font-medium mr-1">A:</span>
            <span>3.50 - 4.00</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium mr-1">B:</span>
            <span>3.00 - 3.49</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium mr-1">C:</span>
            <span>2.50 - 2.99</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium mr-1">D:</span>
            <span>2.00 - 2.49</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchSection; 